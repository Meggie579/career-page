import { NextResponse } from 'next/server';

type YahooPoint = {
  date: string;
  value: number;
};

type MarketRange = '1mo' | '1y';

const TROY_OUNCE_GRAMS = 31.1034768;

function cnyPerGram(goldUsdPerOunce: number, usdCny: number) {
  return (goldUsdPerOunce * usdCny) / TROY_OUNCE_GRAMS;
}

const fallbackMarketData = {
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

function getInterval(range: MarketRange) {
  return range === '1y' ? '1wk' : '1d';
}

function formatPointDate(timestamp: number, range: MarketRange) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: range === '1mo' ? 'numeric' : undefined,
    timeZone: 'UTC',
    year: range === '1y' ? '2-digit' : undefined
  }).format(new Date(timestamp * 1000));
}

async function fetchYahooChart(symbol: string, range: MarketRange): Promise<YahooPoint[]> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?range=${range}&interval=${getInterval(range)}`,
    {
      cache: 'no-store'
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch ${symbol}`);
  }

  const json = await response.json();
  const result = json.chart?.result?.[0];
  const timestamps: number[] | undefined = result?.timestamp;
  const closes: Array<number | null> | undefined = result?.indicators?.quote?.[0]?.close;

  if (!timestamps?.length || !closes?.length) {
    throw new Error(`No chart data for ${symbol}`);
  }

  return timestamps
    .map((timestamp, index) => {
      const close = closes[index];

      if (typeof close !== 'number') {
        return null;
      }

      return {
        date: formatPointDate(timestamp, range),
        value: close
      };
    })
    .filter((point): point is YahooPoint => point !== null);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range: MarketRange = searchParams.get('range') === '1y' ? '1y' : '1mo';

  try {
    const [goldUsdPoints, usdCnyPoints, nzdCnyPoints] = await Promise.all([
      fetchYahooChart('GC=F', range),
      fetchYahooChart('CNY=X', range),
      fetchYahooChart('NZDCNY=X', range)
    ]);

    const latestGoldUsd = goldUsdPoints.at(-1)?.value;
    const latestUsdCny = usdCnyPoints.at(-1)?.value;
    const latestNzdCny = nzdCnyPoints.at(-1)?.value;

    if (!latestGoldUsd || !latestUsdCny || !latestNzdCny) {
      throw new Error('Missing latest market values');
    }

    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      gold: {
        usd: latestGoldUsd,
        cny: cnyPerGram(latestGoldUsd, latestUsdCny),
        points: goldUsdPoints.map((point, index) => {
          const usdCny = usdCnyPoints[index]?.value ?? latestUsdCny;

          return {
            date: point.date,
            usd: point.value,
            cny: cnyPerGram(point.value, usdCny)
          };
        })
      },
      rates: {
        usdCny: {
          latest: latestUsdCny,
          points: usdCnyPoints
        },
        nzdCny: {
          latest: latestNzdCny,
          points: nzdCnyPoints
        }
      },
      source: 'yahoo'
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch {
    return NextResponse.json(fallbackMarketData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  }
}
