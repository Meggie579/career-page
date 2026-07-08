import { MarketWatch } from '@/components/personal-dashboard/market-watch';
import Link from 'next/link';

const menuItems = [
  { label: 'Dashboard', icon: '\u{1F3E0}', href: '/', active: true },
  { label: 'Career', icon: '\u{1F4BC}', href: '/career', active: false },
  { label: 'Engineering', icon: '\u{1F3D7}', href: '#', active: false },
  { label: 'Novel', icon: '\u{270D}', href: '/novel', active: false }
];

function getToday() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());
}

export default function Page() {
  return (
    <main className='min-h-screen bg-[#9fc7e6] px-4 py-6 text-[#12342f] sm:px-6 lg:px-8'>
      <div className='pointer-events-none fixed inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white via-white/80 to-transparent' />
      <div className='pointer-events-none fixed -left-20 top-24 h-72 w-72 rounded-full bg-white/35 blur-3xl' />
      <div className='pointer-events-none fixed right-0 top-0 h-96 w-96 rounded-full bg-[#d9eefb]/50 blur-3xl' />

      <div className='relative mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-[2rem] border border-white/35 bg-[#cfe5f5]/35 p-4 shadow-[0_30px_90px_rgba(32,86,120,0.22)] backdrop-blur-xl sm:p-6'>
        <nav className='flex flex-col gap-3 rounded-[1.25rem] border border-white/45 bg-white/25 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-wrap gap-2'>
            {menuItems.map((item) => (
              <Link
                className={
                  item.active
                    ? 'inline-flex h-10 items-center gap-2 rounded-full bg-[#173f38] px-4 text-sm font-semibold text-white shadow-sm'
                    : 'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-[#173f38]/80 transition-colors hover:bg-white/45 hover:text-[#173f38]'
                }
                href={item.href}
                key={item.label}
              >
                <span aria-hidden='true'>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          <div className='rounded-full border border-white/45 bg-white/35 px-4 py-2 text-sm font-medium text-[#173f38] shadow-sm backdrop-blur'>
            {getToday()}
          </div>
        </nav>

        <header className='rounded-[1.5rem] border border-white/45 bg-[#9fc7e6]/55 px-5 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]'>
          <p className='text-sm font-medium text-white/90'>Personal market workspace</p>
          <h1 className='mt-2 text-4xl font-semibold tracking-normal text-white sm:text-5xl'>
            Meggie&apos;s Dashboard
          </h1>
          <p className='mx-auto mt-3 max-w-2xl text-sm text-white/82'>
            Gold, NZD/CNY, and USD/CNY in one calm daily view.
          </p>
        </header>

        <MarketWatch />
      </div>
    </main>
  );
}
