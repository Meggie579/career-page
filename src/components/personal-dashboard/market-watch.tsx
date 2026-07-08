'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type MarketData = {
  updatedAt: string;
  gold: {
    usd: number;
    cny: number;
    points: Array<{
      date: string;
      usd: number;
      cny: number;
    }>;
  };
  rates: {
    usdCny: {
      latest: number;
      points: Array<{ date: string; value: number }>;
    };
    nzdCny: {
      latest: number;
      points: Array<{ date: string; value: number }>;
    };
  };
  source: 'yahoo' | 'fallback';
};

type MarketRange = '1mo' | '1y';

const fallbackMarketData: MarketData = {
  updatedAt: new Date().toISOString(),
  gold: {
    usd: 2388.4,
    cny: 554.55,
    points: [
      { date: 'Jun 10', usd: 2320, cny: 538.36 },
      { date: 'Jun 14', usd: 2338, cny: 543.22 },
      { date: 'Jun 18', usd: 2351, cny: 546.3 },
      { date: 'Jun 22', usd: 2367, cny: 550.36 },
      { date: 'Jun 26', usd: 2376, cny: 552.61 },
      { date: 'Jun 30', usd: 2388, cny: 554.55 }
    ]
  },
  rates: {
    usdCny: {
      latest: 7.222,
      points: [
        { date: 'Jun 10', value: 7.217 },
        { date: 'Jun 14', value: 7.221 },
        { date: 'Jun 18', value: 7.218 },
        { date: 'Jun 22', value: 7.224 },
        { date: 'Jun 26', value: 7.226 },
        { date: 'Jun 30', value: 7.222 }
      ]
    },
    nzdCny: {
      latest: 4.42,
      points: [
        { date: 'Jun 10', value: 4.39 },
        { date: 'Jun 14', value: 4.41 },
        { date: 'Jun 18', value: 4.4 },
        { date: 'Jun 22', value: 4.43 },
        { date: 'Jun 26', value: 4.42 },
        { date: 'Jun 30', value: 4.42 }
      ]
    }
  },
  source: 'fallback'
};

const rateLabels = {
  usdCny: 'USD/CNY',
  nzdCny: 'NZD/CNY'
};

const rangeLabels: Record<MarketRange, string> = {
  '1mo': '1M',
  '1y': '1Y'
};

function formatMoney(value: number, currency: 'USD' | 'CNY', maximumFractionDigits?: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: maximumFractionDigits ?? (currency === 'USD' ? 2 : 0)
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

async function fetchMarketData(range: MarketRange) {
  const response = await fetch(`/api/market?range=${range}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to load market data');
  }

  return (await response.json()) as MarketData;
}

export function MarketWatch() {
  const [goldData, setGoldData] = React.useState<MarketData>(fallbackMarketData);
  const [rateData, setRateData] = React.useState<MarketData>(fallbackMarketData);
  const [goldRange, setGoldRange] = React.useState<MarketRange>('1mo');
  const [rateRange, setRateRange] = React.useState<MarketRange>('1mo');
  const [selectedRate, setSelectedRate] = React.useState<keyof MarketData['rates']>('nzdCny');
  const selectedRateData = rateData.rates[selectedRate];

  React.useEffect(() => {
    let isMounted = true;

    fetchMarketData(goldRange)
      .then((data) => {
        if (isMounted) {
          setGoldData(data);
        }
      })
      .catch(() => {
        // Keep the local fallback data visible if the market feed is unavailable.
      });

    return () => {
      isMounted = false;
    };
  }, [goldRange]);

  React.useEffect(() => {
    let isMounted = true;

    fetchMarketData(rateRange)
      .then((data) => {
        if (isMounted) {
          setRateData(data);
        }
      })
      .catch(() => {
        // Keep the local fallback data visible if the market feed is unavailable.
      });

    return () => {
      isMounted = false;
    };
  }, [rateRange]);

  return (
    <section className='grid gap-6 lg:grid-cols-[1fr_0.95fr]'>
      <Card className='rounded-[1.5rem] border-white/70 bg-white/82 text-[#12342f] shadow-[0_18px_50px_rgba(32,86,120,0.12)] backdrop-blur'>
        <CardHeader className='gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <CardTitle className='text-[#12342f]'>Gold Price</CardTitle>
            <CardDescription className='text-[#496761]'>
              RMB per gram trend with one-month and one-year views.
            </CardDescription>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Tabs value={goldRange} onValueChange={(value) => setGoldRange(value as MarketRange)}>
              <TabsList className='rounded-full bg-[#eaf4fa] p-1'>
                {Object.entries(rangeLabels).map(([value, label]) => (
                  <TabsTrigger
                    className='rounded-full data-[state=active]:bg-[#173f38] data-[state=active]:text-white'
                    key={value}
                    value={value}
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Badge
              variant='outline'
              className='border-[#b7d4cd] bg-[#dbe9df] text-[#173f38]'
            >
              {goldData.source === 'yahoo' ? 'Live' : 'Sample'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className='space-y-5'>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='rounded-2xl border border-[#d7e8ee] bg-[#f7fbfd] p-4 shadow-sm'>
              <p className='text-sm text-[#496761]'>USD / oz</p>
              <p className='mt-2 text-2xl font-semibold text-[#12342f]'>
                {formatMoney(goldData.gold.usd, 'USD')}
              </p>
            </div>
            <div className='rounded-2xl border border-[#d7e8ee] bg-[#f7fbfd] p-4 shadow-sm'>
              <p className='text-sm text-[#496761]'>RMB / gram</p>
              <p className='mt-2 text-2xl font-semibold text-[#12342f]'>
                {formatMoney(goldData.gold.cny, 'CNY', 2)}
              </p>
            </div>
          </div>
          <ChartContainer
            className='h-80 w-full rounded-2xl border border-[#d7e8ee] bg-[#f7fbfd] p-3'
            config={{
              cny: { label: 'CNY / gram', color: '#75acd3' }
            }}
          >
            <AreaChart data={goldData.gold.points} margin={{ left: 6, right: 18, top: 18, bottom: 4 }}>
              <defs>
                <linearGradient id='gold-rmb-trend' x1='0' x2='0' y1='0' y2='1'>
                  <stop offset='5%' stopColor='var(--color-cny)' stopOpacity={0.42} />
                  <stop offset='95%' stopColor='var(--color-cny)' stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke='#d7e8ee' strokeDasharray='4 6' vertical={false} />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fill: '#496761', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                domain={['dataMin - 8', 'dataMax + 8']}
                tick={{ fill: '#496761', fontSize: 12 }}
                tickFormatter={(value) => `RMB ${Number(value).toFixed(0)}`}
                tickLine={false}
                width={72}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey='cny'
                type='monotone'
                stroke='var(--color-cny)'
                fill='url(#gold-rmb-trend)'
                fillOpacity={1}
                strokeWidth={4}
                activeDot={{ r: 7, fill: '#173f38', stroke: 'white', strokeWidth: 3 }}
                dot={{ r: 4, fill: '#75acd3', stroke: 'white', strokeWidth: 2 }}
              />
            </AreaChart>
          </ChartContainer>
          <p className='text-xs text-[#6b8580]'>
            {rangeLabels[goldRange]} trend - Updated {formatDate(goldData.updatedAt)}
          </p>
        </CardContent>
      </Card>

      <Card className='rounded-[1.5rem] border-white/70 bg-white/82 text-[#12342f] shadow-[0_18px_50px_rgba(32,86,120,0.12)] backdrop-blur'>
        <CardHeader className='gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <CardTitle className='text-[#12342f]'>Exchange Rates</CardTitle>
            <CardDescription className='text-[#496761]'>
              Switch currency pair and compare one-month or one-year trends.
            </CardDescription>
          </div>
          <div className='flex flex-wrap justify-end gap-2'>
            <Tabs value={selectedRate} onValueChange={(value) => setSelectedRate(value as keyof MarketData['rates'])}>
              <TabsList className='rounded-full bg-[#eaf4fa] p-1'>
                <TabsTrigger
                  className='rounded-full data-[state=active]:bg-[#173f38] data-[state=active]:text-white'
                  value='nzdCny'
                >
                  NZD
                </TabsTrigger>
                <TabsTrigger
                  className='rounded-full data-[state=active]:bg-[#173f38] data-[state=active]:text-white'
                  value='usdCny'
                >
                  USD
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={rateRange} onValueChange={(value) => setRateRange(value as MarketRange)}>
              <TabsList className='rounded-full bg-[#eaf4fa] p-1'>
                {Object.entries(rangeLabels).map(([value, label]) => (
                  <TabsTrigger
                    className='rounded-full data-[state=active]:bg-[#173f38] data-[state=active]:text-white'
                    key={value}
                    value={value}
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className='space-y-5'>
          <div className='rounded-2xl border border-[#d7e8ee] bg-[#f7fbfd] p-4 shadow-sm'>
            <p className='text-sm text-[#496761]'>{rateLabels[selectedRate]}</p>
            <p className='mt-2 text-3xl font-semibold text-[#12342f]'>
              {selectedRateData.latest.toFixed(4)}
            </p>
          </div>
          <ChartContainer
            className='h-64 w-full rounded-2xl border border-[#d7e8ee] bg-[#f7fbfd] p-3'
            config={{
              value: { label: rateLabels[selectedRate], color: '#173f38' }
            }}
          >
            <LineChart data={selectedRateData.points} margin={{ left: 0, right: 10 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey='date' tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey='value'
                type='monotone'
                stroke='var(--color-value)'
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
          <p className='text-xs text-[#6b8580]'>
            {rangeLabels[rateRange]} trend - Updated {formatDate(rateData.updatedAt)}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
