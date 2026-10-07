const jwt = require('jsonwebtoken');
require('dotenv').config();

async function test() {
    const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET);
    try {
        const res = await fetch('http://localhost:5000/api/dashboard/admin', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("STATUS:", res.status);
        console.log("SUCCESS:", data);
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}
test();
