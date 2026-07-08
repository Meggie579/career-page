'use client';

import React from 'react';

const orbitCards = [
  {
    label: 'Current Site',
    title: 'DoubleTree by Hilton Auckland',
    meta: 'HVAC / Coordination / Commissioning',
    detail: 'Multi-floor hotel delivery with inspections, defect rectification, interface testing, and NZ compliance.'
  },
  {
    label: 'Measured Impact',
    title: '6.9% Efficiency Gain',
    meta: 'BYD Battery / LOA Stacking',
    detail: 'Improved machine performance through production support, commissioning, monitoring, and optimisation.'
  },
  {
    label: 'System Layer',
    title: 'NZBC + AS/NZS',
    meta: 'Quality / Fire / Seismic',
    detail: 'Site work guided by code awareness, installation quality, compliance checks, and stakeholder coordination.'
  },
  {
    label: 'Toolchain',
    title: 'CAD + Analysis',
    meta: 'AutoCAD / SolidWorks / ANSYS / MATLAB',
    detail: 'Mechanical design, engineering documentation, CFD exposure, and technical reporting.'
  },
  {
    label: 'Research Build',
    title: 'Bionic Robotic Crab',
    meta: 'Mechanical Design / Prototype',
    detail: 'Six-legged amphibious robot with dual mechanical claws for handling and collection tasks.'
  },
  {
    label: 'Education',
    title: 'University of Auckland',
    meta: 'MEng / Industry 4.0 / Advanced CFD',
    detail: 'Mechanical engineering foundation extended into product development and smart manufacturing.'
  }
];

const timeline = [
  ['2025 - Now', 'Smart Building Solutions', 'Mechanical Building Services Engineer'],
  ['2023 - 2025', 'University of Auckland', 'Master of Mechanical Engineering'],
  ['2022 - 2023', 'FinDreams Battery BYD', 'Mechanical Engineer'],
  ['2017 - 2021', 'Harbin Engineering University', 'Mechanical Design and Automation']
];

const capabilities = [
  'HVAC systems',
  'Site inspection',
  'Commissioning support',
  'Defect management',
  'NZBC / AS/NZS',
  'Fire and seismic coordination',
  'Production optimisation',
  'Technical reporting',
  'AutoCAD',
  'SolidWorks',
  'ANSYS Fluent',
  'MATLAB'
];

function useReveal() {
  React.useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-visible', 'true');
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}

function CareerOrbit() {
  const [rotation, setRotation] = React.useState(0);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStart = React.useRef({ x: 0, rotation: 0 });

  function spinTo(index: number) {
    setActiveIndex(index);
    setRotation(-index * 60);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    setIsDragging(true);
    dragStart.current = { x: event.clientX, rotation };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) {
      return;
    }

    const nextRotation = dragStart.current.rotation + (event.clientX - dragStart.current.x) * 0.35;
    setRotation(nextRotation);
  }

  function handlePointerUp() {
    if (!isDragging) {
      return;
    }

    setIsDragging(false);
    const normalized = ((rotation % 360) + 360) % 360;
    const nextIndex = Math.round((360 - normalized) / 60) % orbitCards.length;
    spinTo(nextIndex);
  }

  const activeCard = orbitCards[activeIndex];

  return (
    <div className='grid gap-5 lg:grid-cols-[1fr_0.72fr] lg:items-center'>
      <div
        className='relative min-h-[500px] cursor-grab overflow-hidden rounded-[2rem] border border-white/10 bg-[#080d12] active:cursor-grabbing'
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ perspective: '1200px' }}
      >
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(101,255,204,0.16),transparent_19rem),radial-gradient(circle_at_50%_64%,rgba(99,179,255,0.11),transparent_22rem)]' />
        <div className='absolute inset-8 rounded-full border border-white/[0.06]' />
        <div className='absolute inset-16 rounded-full border border-white/[0.04]' />
        <div className='absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#8ff8d4]/16 bg-[#09141b]/80 shadow-[0_0_70px_rgba(92,240,198,0.14)]' />
        <div className='absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d9fff2] shadow-[0_0_90px_rgba(136,255,215,0.36)]' />
        <div className='absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#082019]'>
          Meggie
          <br />
          Systems
        </div>

        <div className='absolute inset-0 flex items-center justify-center' style={{ transformStyle: 'preserve-3d' }}>
          <div
            className={isDragging ? '' : 'career-orbit'}
            style={
              {
                '--orbit-rotation': `${rotation}deg`,
                transform: `rotateY(${rotation}deg)`,
                transformStyle: 'preserve-3d'
              } as React.CSSProperties
            }
          >
            {orbitCards.map((card, index) => (
              <button
                className={
                  activeIndex === index
                    ? 'absolute left-1/2 top-1/2 flex h-56 w-48 -translate-x-1/2 -translate-y-1/2 flex-col justify-between rounded-[1.35rem] border border-[#a4ffe0]/45 bg-[#eafff8] p-4 text-left text-[#071412] shadow-[0_24px_70px_rgba(137,255,217,0.22)]'
                    : 'absolute left-1/2 top-1/2 flex h-56 w-48 -translate-x-1/2 -translate-y-1/2 flex-col justify-between rounded-[1.35rem] border border-white/12 bg-white/[0.075] p-4 text-left text-white shadow-[0_20px_55px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-[#a4ffe0]/38 hover:bg-white/[0.11]'
                }
                key={card.title}
                onClick={() => spinTo(index)}
                style={{
                  transform: `rotateY(${index * 60}deg) translateZ(320px)`
                }}
                type='button'
              >
                <div>
                  <p
                    className={
                      activeIndex === index
                        ? 'text-xs font-semibold uppercase tracking-[0.18em] text-[#08735d]'
                        : 'text-xs font-semibold uppercase tracking-[0.18em] text-[#8ff8d4]'
                    }
                  >
                    {card.label}
                  </p>
                  <h3 className='mt-3 text-lg font-semibold leading-tight'>{card.title}</h3>
                  <p className={activeIndex === index ? 'mt-2 text-xs text-[#38635c]' : 'mt-2 text-xs text-white/55'}>
                    {card.meta}
                  </p>
                </div>
                <p className={activeIndex === index ? 'text-xs leading-5 text-[#244b44]' : 'text-xs leading-5 text-white/58'}>
                  {card.detail}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className='absolute bottom-5 left-5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-white/55 backdrop-blur'>
          Drag or tap cards to rotate
        </div>
      </div>

      <aside className='rounded-[2rem] border border-white/10 bg-[#0c1117]/88 p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6'>
        <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[#8ff8d4]'>Selected module</p>
        <h2 className='mt-4 text-3xl font-semibold tracking-normal'>{activeCard.title}</h2>
        <p className='mt-3 text-sm text-white/52'>{activeCard.meta}</p>
        <p className='mt-6 text-sm leading-7 text-white/72'>{activeCard.detail}</p>
        <div className='mt-8 grid gap-3'>
          {['Problem framing', 'Technical coordination', 'Delivery evidence'].map((item, index) => (
            <div className='rounded-2xl border border-white/10 bg-white/[0.055] p-4' key={item}>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-white/74'>{item}</span>
                <span className='text-[#8ff8d4]'>{88 - index * 7}%</span>
              </div>
              <div className='mt-3 h-1.5 rounded-full bg-white/10'>
                <div
                  className='h-full rounded-full bg-gradient-to-r from-[#8ff8d4] to-[#9fc7ff]'
                  style={{ width: `${88 - index * 7}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export function CareerShowcase() {
  useReveal();

  return (
    <section className='space-y-6 text-[#101820]'>
      <style jsx global>{`
        [data-reveal] {
          opacity: 0;
          transform: translateY(26px);
          transition:
            opacity 760ms ease,
            transform 760ms ease;
        }

        [data-reveal][data-visible='true'] {
          opacity: 1;
          transform: translateY(0);
        }

        .career-orbit {
          animation: career-orbit-idle 22s linear infinite;
        }

        .career-orbit:hover {
          animation-play-state: paused;
        }

        @keyframes career-orbit-idle {
          from {
            transform: rotateY(var(--orbit-rotation));
          }
          to {
            transform: rotateY(calc(var(--orbit-rotation) + 360deg));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [data-reveal] {
            opacity: 1;
            transform: none;
            transition: none;
          }

          .career-orbit {
            animation: none;
          }
        }
      `}</style>

      <section
        className='relative overflow-hidden rounded-[2rem] border border-white/60 bg-[#f7faf8] p-5 shadow-[0_28px_80px_rgba(19,33,43,0.12)] sm:p-8'
        data-reveal
      >
        <div className='absolute right-0 top-0 h-72 w-72 rounded-full bg-[#b7f8df]/45 blur-3xl' />
        <div className='absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#b9d8ff]/35 blur-3xl' />
        <div className='relative grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.32em] text-[#08735d]'>Mechanical systems portfolio</p>
            <h1 className='mt-5 max-w-3xl text-5xl font-semibold leading-tight tracking-normal text-[#111820] sm:text-7xl'>
              Shiyue Jin <span className='text-[#08735d]'>(Meggie)</span>
            </h1>
          </div>
          <div className='lg:pb-2'>
            <p className='max-w-2xl text-base leading-7 text-[#53636b] sm:text-lg'>
              A quieter, sharper career interface for HVAC building services, NZ compliance, and advanced
              manufacturing experience. Built around interaction instead of static resume blocks.
            </p>
            <div className='mt-6 flex flex-wrap gap-3'>
              <a
                className='rounded-full bg-[#101820] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#08735d]'
                href='mailto:jinshiyue579@gmail.com'
              >
                Contact
              </a>
              <a
                className='rounded-full border border-[#101820]/12 bg-white/70 px-5 py-3 text-sm font-semibold text-[#101820] transition hover:-translate-y-0.5 hover:border-[#08735d]/35 hover:text-[#08735d]'
                href='https://www.linkedin.com/in/shiyue-jin-b058b2288'
                rel='noreferrer'
                target='_blank'
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      <section data-reveal>
        <CareerOrbit />
      </section>

      <section data-reveal>
        <div className='rounded-[2rem] border border-white/60 bg-[#f7faf8] p-5 shadow-[0_24px_70px_rgba(19,33,43,0.1)] sm:p-6'>
          <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[#08735d]'>Capability cloud</p>
          <div className='mt-5 flex flex-wrap gap-2'>
            {capabilities.map((skill) => (
              <span
                className='rounded-full border border-[#101820]/10 bg-white px-3 py-2 text-sm font-medium text-[#2b3a42] transition hover:-translate-y-0.5 hover:border-[#08735d]/35 hover:bg-[#eefbf6] hover:text-[#08735d]'
                key={skill}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        className='overflow-hidden rounded-[2rem] border border-white/60 bg-[#101820] p-5 text-white shadow-[0_24px_70px_rgba(19,33,43,0.16)] sm:p-6'
        data-reveal
      >
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[#8ff8d4]'>Trajectory</p>
            <h2 className='mt-3 text-3xl font-semibold tracking-normal'>Sliding career timeline</h2>
          </div>
          <p className='max-w-md text-sm leading-6 text-white/52'>
            Slide horizontally to move through education, manufacturing, and building services experience.
          </p>
        </div>

        <div className='mt-7 overflow-x-auto pb-4 [scrollbar-color:rgba(143,248,212,0.45)_transparent] [scrollbar-width:thin]'>
          <div className='relative flex min-w-max snap-x snap-mandatory gap-4 pr-4'>
            <div className='absolute left-8 right-8 top-[3.55rem] h-px bg-gradient-to-r from-transparent via-[#8ff8d4]/50 to-transparent' />
            {timeline.map(([time, org, title], index) => (
              <article
                className='relative w-[18rem] shrink-0 snap-start rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur transition hover:-translate-y-1 hover:border-[#8ff8d4]/38 hover:bg-white/[0.08] sm:w-[22rem]'
                key={`${time}-${org}`}
              >
                <div className='relative z-10 mb-6 flex h-9 w-9 items-center justify-center rounded-full border border-[#8ff8d4]/40 bg-[#101820] text-sm font-semibold text-[#8ff8d4] shadow-[0_0_24px_rgba(143,248,212,0.22)]'>
                  {index + 1}
                </div>
                <p className='text-sm font-semibold text-[#8ff8d4]'>{time}</p>
                <h3 className='mt-3 text-lg font-semibold'>{title}</h3>
                <p className='mt-2 text-sm text-white/55'>{org}</p>
                <div className='mt-5 h-1.5 rounded-full bg-white/10'>
                  <div
                    className='h-full rounded-full bg-gradient-to-r from-[#8ff8d4] to-[#9fc7ff]'
                    style={{ width: `${92 - index * 10}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
