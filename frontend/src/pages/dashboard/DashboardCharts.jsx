import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    AreaChart,
    Area,
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white text-slate-700 text-sm rounded-lg px-4 py-3 shadow-lg border border-slate-100">
                <p className="font-medium text-slate-500 mb-1">{payload[0].payload.name}</p>
                <p
                    className="font-bold text-lg text-slate-800"
                    style={{ color: payload[0].payload.fillColor || "#3b82f6" }}
                >
                    {payload[0].value}{" "}
                    <span className="text-sm font-medium text-slate-500">Tiket</span>
                </p>
            </div>
        );
    }
    return null;
};

export function SlaDonutChart({ chartSegments, hasData, onSliceClick }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={chartSegments}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={hasData ? 3 : 0}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={false}
                    className={hasData ? "cursor-pointer" : ""}
                    onClick={(e) => e && onSliceClick?.(e)}
                >
                    {chartSegments.map((entry, index) => (
                        <Cell
                            key={`sla-cell-${index}`}
                            fill={entry.color}
                            className={hasData ? "hover:opacity-80 transition-opacity cursor-pointer" : ""}
                        />
                    ))}
                </Pie>
                {hasData && (
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length && !payload[0].payload.isDummy) {
                                const item = payload[0].payload;
                                return (
                                    <div className="bg-white text-slate-700 text-xs rounded-xl px-3 py-2 shadow-lg border border-slate-100">
                                        <p className="font-semibold text-slate-800">{item.name}</p>
                                        <p className="font-bold text-sm mt-0.5" style={{ color: item.color }}>
                                            {item.value}{" "}
                                            <span className="text-xs font-normal text-slate-500">
                                                tiket ({item.percent}%)
                                            </span>
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                )}
            </PieChart>
        </ResponsiveContainer>
    );
}

export function StatusBarChart({ data, canViewTickets, onBarClick }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 12 }}
                onClick={(e) => {
                    if (canViewTickets && e && e.activePayload && e.activePayload.length > 0) {
                        const clicked = e.activePayload[0].payload;
                        const statusKey = (clicked.name || "").toLowerCase().replace(/ /g, "_");
                        if (statusKey) {
                            onBarClick?.(statusKey);
                        }
                    }
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                    dataKey="shortName"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
                    dy={8}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                    allowDecimals={false}
                    dx={-10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={38}
                    className="cursor-pointer"
                    isAnimationActive={false}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={entry.fillColor}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export function RevenueTrendAreaChart({ data, formatRupiah }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 8 }}>
                <defs>
                    <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                    dataKey="bulan"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(v) =>
                        v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v
                    }
                />
                <Tooltip
                    formatter={(value) => [formatRupiah(value), "Pendapatan"]}
                    contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{ fontWeight: 600, color: "#334155" }}
                />
                <Area
                    type="monotone"
                    dataKey="pendapatan"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#colorPendapatan)"
                    dot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function TeknisiTaskDonutChart({ data, onSliceClick }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={false}
                    className="cursor-pointer"
                    onClick={(e) => {
                        if (e && e.name) {
                            const statusKey = e.name.toLowerCase().replace(/ /g, "_");
                            onSliceClick?.(statusKey);
                        }
                    }}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={entry.fillColor}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
            </PieChart>
        </ResponsiveContainer>
    );
}
