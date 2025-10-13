
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, LabelList } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Card, CardContent } from "../ui/card";
import { format } from "date-fns";

// Revenue Chart
const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ChartContainer config={revenueChartConfig} className="min-h-[200px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ top: 20, left: -20, right: 20, bottom: 20 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
          className="text-xs sm:text-sm"
        />
         <YAxis
            tickFormatter={(value) => `€${Number(value) / 1000}k`}
            tickLine={false}
            axisLine={false}
            className="text-xs sm:text-sm"
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent
            formatter={(value, name, props) => [
              `€${Number(value).toLocaleString()}`,
              `Revenue for ${props.payload.month}`
            ]}
            labelFormatter={(label) => `Month: ${label}`}
            indicator="dot"
            />}
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4}>
            <LabelList
                dataKey="revenue"
                position="top"
                offset={8}
                className="fill-foreground text-xs hidden sm:block"
                formatter={(value: number) => `€${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

// Top Clients Chart
const topClientsChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function TopClientsChart({ data }: { data: { name: string; revenue: number }[] }) {
  return (
    <ChartContainer config={topClientsChartConfig} className="min-h-[300px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          width={120}
          className="text-xs sm:text-sm"
          tickFormatter={(value) => (value.length > 15 ? `${value.substring(0, 15)}...` : value)}
        />
        <XAxis type="number" hide />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent
            indicator="dot"
            formatter={(value, name, props) => [
              `€${Number(value).toLocaleString()}`,
              `Revenue from ${props.payload.name}`
            ]}
            labelFormatter={() => 'Client Revenue'}
          />}
        />
        <Bar dataKey="revenue" layout="vertical" fill="var(--color-revenue)" radius={4}>
           <LabelList
                dataKey="revenue"
                position="right"
                offset={8}
                className="fill-foreground text-xs hidden md:block"
                formatter={(value: number) => `€${value.toLocaleString()}`}
            />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

// Top Equipment Chart
export function TopEquipmentChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <CardContent className="p-0">
        <ul className="space-y-2">
            {data.map((item, index) => (
                <li key={index} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/30">
                    <span className="font-medium truncate pr-2">{item.name}</span>
                    <span className="font-bold">{item.count}</span>
                </li>
            ))}
        </ul>
    </CardContent>
  )
}
