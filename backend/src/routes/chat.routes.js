const express = require("express");
const prisma = require("../config/database");
const { authenticate } = require("../middleware/auth");
const { broadcast } = require("../utils/sse");
const router = express.Router();
router.use(authenticate);

const idOf = value => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const fail = (res, status, message) => res.status(status).json({ message });
const member = (chatId, userId) => prisma.chatMember.findUnique({ where: { chat_id_user_id: { chat_id: chatId, user_id: userId } } });

router.get("/users", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim().slice(0, 80);
    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
        ...(q ? { OR: [{ nama: { contains: q } }, { username: { contains: q } }] } : {})
      },
      select: {
        id: true,
        nama: true,
        username: true,
        foto_profile: true,
        role: true
      },
      take: 30,
      orderBy: { nama: "asc" }
    });
    res.json(users);
  } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try {
    const rows = await prisma.chatMember.findMany({
      where: { user_id: req.user.id },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, nama: true, username: true, foto_profile: true, role: true }
                }
              }
            },
            messages: {
              take: 1,
              orderBy: { id: "desc" }
            }
          }
        }
      }
    });

    // Sort active conversations by latest message / activity desc
    const chats = await Promise.all(rows.map(async row => {
      const other = row.chat.members.find(m => m.user_id !== req.user.id)?.user || null;
      const lastMessage = row.chat.messages[0] || null;
      const isUnread = Boolean(
        lastMessage &&
        lastMessage.sender_id !== req.user.id &&
        (!row.last_read_at || new Date(lastMessage.created_at) > new Date(row.last_read_at))
      );
      const unreadCount = isUnread ? await prisma.chatMessage.count({
        where: {
          chat_id: row.chat_id,
          sender_id: { not: req.user.id },
          ...(row.last_read_at ? { created_at: { gt: row.last_read_at } } : {})
        }
      }) : 0;
      return {
        id: row.chat_id,
        other,
        lastMessage,
        lastReadAt: row.last_read_at,
        isUnread,
        unreadCount,
        updatedAt: lastMessage ? lastMessage.created_at : row.chat.created_at
      };
    }));
    chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json(chats);
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const other = idOf(req.body?.user_id);
    if (!other || other === req.user.id) return fail(res, 400, "Pilih pengguna lain yang valid");
    const targetUser = await prisma.user.findUnique({ where: { id: other }, select: { id: true, nama: true } });
    if (!targetUser) return fail(res, 404, "Pengguna tidak ditemukan");

    const [first_user_id, second_user_id] = [req.user.id, other].sort((a, b) => a - b);
    const chat = await prisma.chat.upsert({
      where: { first_user_id_second_user_id: { first_user_id, second_user_id } },
      update: {},
      create: {
        first_user_id,
        second_user_id,
        members: {
          create: [{ user_id: first_user_id }, { user_id: second_user_id }]
        }
      }
    });
    res.json({ id: chat.id });
  } catch (e) { next(e); }
});

router.get("/:id/messages", async (req, res, next) => {
  try {
    const chatId = idOf(req.params.id), before = req.query.before ? idOf(req.query.before) : null;
    if (!chatId || (req.query.before && !before)) return fail(res, 400, "ID tidak valid");
    if (!await member(chatId, req.user.id)) return fail(res, 404, "Percakapan tidak ditemukan");

    const messages = await prisma.chatMessage.findMany({
      where: { chat_id: chatId, ...(before ? { id: { lt: before } } : {}) },
      orderBy: { id: "desc" },
      take: 50
    });
    res.json(messages.reverse());
  } catch (e) { next(e); }
});

router.post("/:id/messages", async (req, res, next) => {
  try {
    const chatId = idOf(req.params.id);
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!chatId || !body || body.length > 4000) return fail(res, 400, "Pesan harus berisi 1–4000 karakter");
    if (!await member(chatId, req.user.id)) return fail(res, 404, "Percakapan tidak ditemukan");

    const sender = await prisma.user.findUnique({ where: { id: req.user.id }, select: { nama: true } });
    const senderName = sender?.nama || req.user.nama || req.user.username || "Staf";

    const [message] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          chat_id: chatId,
          sender_id: req.user.id,
          sender_name: senderName,
          body
        }
      }),
      prisma.chatMember.update({
        where: { chat_id_user_id: { chat_id: chatId, user_id: req.user.id } },
        data: { last_read_at: new Date() }
      })
    ]);

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { first_user_id: true, second_user_id: true }
    });

    const eventPayload = {
      chatId,
      senderId: req.user.id,
      senderName,
      bodySnippet: body.slice(0, 120),
      createdAt: message.created_at
    };

    await Promise.all([
      broadcast("chat:updated", eventPayload, { userId: chat.first_user_id }),
      broadcast("chat:updated", eventPayload, { userId: chat.second_user_id })
    ]);

    res.status(201).json(message);
  } catch (e) { next(e); }
});

router.patch("/:id/read", async (req, res, next) => {
  try {
    const chatId = idOf(req.params.id);
    if (!chatId || !await member(chatId, req.user.id)) return fail(res, 404, "Percakapan tidak ditemukan");
    await prisma.chatMember.update({
      where: { chat_id_user_id: { chat_id: chatId, user_id: req.user.id } },
      data: { last_read_at: new Date() }
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get("/:id/export", async (req, res, next) => {
  try {
    const chatId = idOf(req.params.id), format = req.query.format === "json" ? "json" : "txt";
    if (!chatId || !await member(chatId, req.user.id)) return fail(res, 404, "Percakapan tidak ditemukan");
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: { include: { user: { select: { nama: true } } } } }
    });
    const participantNames = chat.members.map(m => m.user?.nama || "Mantan Staf");
    res.set("Content-Disposition", `attachment; filename="yvs-chat-${chatId}.${format}"`);
    res.set("Cache-Control", "no-store");
    if (format === "json") {
      res.type("json");
      res.write('{"timezone":"Asia/Jakarta","participants":' + JSON.stringify(participantNames) + ',"messages":[');
    } else {
      res.type("text/plain; charset=utf-8");
      res.write(`YVS Chat — ${participantNames.join(" & ")}\nZona Waktu: Asia/Jakarta (WIB)\n\n`);
    }
    let cursor = 0, first = true;
    const date = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    while (true) {
      const batch = await prisma.chatMessage.findMany({
        where: { chat_id: chatId, id: { gt: cursor } },
        orderBy: { id: "asc" },
        take: 500
      });
      for (const m of batch) {
        cursor = m.id;
        if (format === "json") {
          res.write((first ? "" : ",") + JSON.stringify(m));
          first = false;
        } else {
          res.write(`[${date.format(m.created_at)}] ${m.sender_name}:\n${m.body}\n\n`);
        }
      }
      if (batch.length < 500) break;
    }
    res.end(format === "json" ? "]}" : "");
  } catch (e) { if (res.headersSent) res.destroy(e); else next(e); }
});

module.exports = router;
