import { CareerShowcase } from '@/components/personal-dashboard/career-showcase';
import Link from 'next/link';

const menuItems = [
  { label: 'Dashboard', icon: '\u{1F3E0}', href: '/', active: false },
  { label: 'Career', icon: '\u{1F4BC}', href: '/career', active: true },
  { label: 'Engineering', icon: '\u{1F3D7}', href: '#', active: false },
  { label: 'Novel', icon: '\u{270D}', href: '/novel', active: false }
];

export default function CareerPage() {
  return (
    <main className='min-h-screen bg-[#dfe7e5] px-4 py-6 text-[#101820] sm:px-6 lg:px-8'>
      <div className='pointer-events-none fixed inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white via-white/70 to-transparent' />
      <div className='pointer-events-none fixed -left-20 top-24 h-72 w-72 rounded-full bg-[#b7f8df]/35 blur-3xl' />
      <div className='pointer-events-none fixed right-0 top-0 h-96 w-96 rounded-full bg-[#b9d8ff]/30 blur-3xl' />

      <div className='relative mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-[2rem] border border-white/65 bg-white/35 p-4 shadow-[0_30px_90px_rgba(19,33,43,0.12)] backdrop-blur-xl sm:p-6'>
        <nav className='flex flex-col gap-3 rounded-[1.25rem] border border-white/70 bg-white/55 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-wrap gap-2'>
            {menuItems.map((item) => (
              <Link
                className={
                  item.active
                    ? 'inline-flex h-10 items-center gap-2 rounded-full bg-[#101820] px-4 text-sm font-semibold text-white shadow-sm'
                    : 'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-[#101820]/70 transition-colors hover:bg-white hover:text-[#08735d]'
                }
                href={item.href}
                key={item.label}
              >
                <span aria-hidden='true'>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          <div className='rounded-full border border-[#101820]/10 bg-white/70 px-4 py-2 text-sm font-medium text-[#101820]/70 shadow-sm backdrop-blur'>
            Interactive career
          </div>
        </nav>

        <CareerShowcase />
      </div>
    </main>
  );
}
