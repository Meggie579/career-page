'use client';

import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { importedNovel, type NovelEntry, type NovelSection } from '@/data/imported-novel';

type EditableSection = Omit<NovelSection, 'id'> & {
  id: string;
};

type EditableNovel = {
  id: string;
  title: string;
  subtitle: string;
  sourcePath?: string;
  sections: EditableSection[];
  characterRelationships?: CharacterRelationship[];
  characterPositions?: Record<string, CharacterPosition>;
};

type CharacterPosition = {
  x: number;
  y: number;
};

type CharacterRelationship = {
  id: string;
  fromId: string;
  toId: string;
  label: string;
};

type SaveStatus = 'saved' | 'unsaved';

const storageKey = 'meggie-novel-library-v2';
const relationshipLabels = ['核心关系', '师门关系', '保护对象', '同门协作', '剧情牵引', '成长线', '冲突线'];

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function migrateSections(sections: EditableSection[]) {
  const nextSections = sections
    .filter((section) => section.id !== 'outline')
    .map((section) => ({
      ...section,
      entries: [...section.entries]
    }));
  const chapters = nextSections.find((section) => section.id === 'chapters');
  const ideas = nextSections.find((section) => section.id === 'ideas');
  const misplacedIdea = chapters?.entries.find((entry) => entry.id === 'fragments');

  if (chapters && ideas && misplacedIdea) {
    chapters.entries = chapters.entries.filter((entry) => entry.id !== 'fragments');

    if (!ideas.entries.some((entry) => entry.id === misplacedIdea.id)) {
      ideas.entries = [misplacedIdea, ...ideas.entries];
    }
  }

  return nextSections;
}

function getSeedNovel(): EditableNovel {
  return {
    id: 'imported-male-supporting-lead',
    title: importedNovel.title,
    subtitle: importedNovel.subtitle,
    sourcePath: importedNovel.sourcePath,
    sections: migrateSections(importedNovel.sections),
    characterRelationships: [],
    characterPositions: {}
  };
}

function createNovel(): EditableNovel {
  return {
    id: createId('novel'),
    title: 'New Novel',
    subtitle: 'A new story workspace.',
    characterRelationships: [],
    characterPositions: {},
    sections: [
      {
        id: createId('section'),
        label: '作品总览',
        description: '故事核心和当前想法。',
        entries: [
          {
            id: createId('entry'),
            title: '核心想法',
            eyebrow: 'Overview',
            summary: 'Write the story idea here.',
            tags: ['new'],
            fields: [{ label: '类型', value: '待定' }],
            content: '在这里写下这部小说的核心设定。'
          }
        ]
      },
      {
        id: 'chapters',
        label: '章节正文',
        description: '每一章单独管理。',
        entries: []
      },
      {
        id: 'characters',
        label: '人物设定',
        description: '人物卡片和关系。',
        entries: []
      },
      {
        id: 'world',
        label: '世界观设定',
        description: '规则、地点、体系和势力。',
        entries: []
      },
      {
        id: 'ideas',
        label: '灵感梗',
        description: '暂时未归档的灵感。',
        entries: []
      }
    ]
  };
}

function createSection(): EditableSection {
  return {
    id: createId('section'),
    label: 'New Section',
    description: 'Describe this section.',
    entries: []
  };
}

function createEntry(sectionLabel: string): NovelEntry {
  return {
    id: createId('entry'),
    title: `New ${sectionLabel}`,
    eyebrow: 'Draft',
    summary: 'Write a short summary.',
    tags: [],
    fields: [],
    content: 'Start writing here.'
  };
}

function createCharacterEntry(): NovelEntry {
  return {
    id: createId('character'),
    title: '新人物',
    eyebrow: '身份 / 定位待补充',
    summary: '在这里写这个人物的核心设定。',
    tags: [],
    fields: [],
    content: '关系、动机、成长线和剧情作用可以写在这里。'
  };
}

function createWorldTableEntry(): NovelEntry {
  return {
    id: createId('world-table'),
    title: '新世界观表格',
    eyebrow: '分类待补充',
    summary: '整理这个世界观分类的核心规则。',
    tags: [],
    fields: [{ label: '项目', value: '说明' }],
    content: '项目：说明'
  };
}

function getEntryPreview(content: string) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean) ?? 'No notes yet.';
}

function getSectionDisplayLabel(section?: Pick<EditableSection, 'id' | 'label'>) {
  if (!section) {
    return 'No module';
  }

  const labels: Record<string, string> = {
    overview: 'Overview',
    chapters: 'Chapters',
    characters: 'Characters',
    world: 'Worldbuilding',
    ideas: 'Ideas',
    sources: 'Sources'
  };
  const legacyLabels: Record<string, string> = {
    overview: '浣滃搧鎬昏',
    chapters: '绔犺妭姝ｆ枃',
    characters: '浜虹墿璁惧畾',
    world: '涓栫晫瑙傝瀹?',
    ideas: '鐏垫劅姊?',
    sources: '鍘熷鏂囦欢'
  };
  const looksMojibake = /[�]|[鈽锛歖]|[绔犳妭浜虹墿涓栫晫鐏垫劅姊浣滃搧]/.test(section.label);

  if (section.label && section.label !== legacyLabels[section.id] && !looksMojibake) {
    return section.label;
  }

  return labels[section.id] ?? section.label;
}

function getWorldTableRows(entry: NovelEntry) {
  if (entry.fields?.length) {
    return entry.fields;
  }

  const rows = entry.content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colonIndex = line.indexOf(':');
      const fullWidthColonIndex = line.indexOf('：');
      const separatorIndex =
        colonIndex < 0
          ? fullWidthColonIndex
          : fullWidthColonIndex < 0
            ? colonIndex
            : Math.min(colonIndex, fullWidthColonIndex);

      if (separatorIndex < 0) {
        return { label: line, value: '' };
      }

      return {
        label: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim()
      };
    });

  return rows.length ? rows : [{ label: entry.title, value: entry.summary }];
}

function serializeWorldTableRows(rows: Array<{ label: string; value: string }>) {
  return rows.map((row) => `${row.label}：${row.value}`).join('\n');
}

function getGraphNodePosition(index: number, total: number) {
  if (index === 0) {
    return { x: 50, y: 50 };
  }

  const ringIndex = index - 1;
  const angle = (ringIndex / Math.max(total - 1, 1)) * Math.PI * 2 - Math.PI / 2;
  const radiusX = total > 10 ? 38 : 34;
  const radiusY = total > 10 ? 40 : 34;

  return {
    x: 50 + Math.cos(angle) * radiusX,
    y: 50 + Math.sin(angle) * radiusY
  };
}

function loadSavedNovels() {
  if (typeof window === 'undefined') {
    return [getSeedNovel()];
  }

  const saved = window.localStorage.getItem(storageKey);

  if (!saved) {
    return [getSeedNovel()];
  }

  try {
    const parsed = JSON.parse(saved) as EditableNovel[];
    return parsed.length
      ? parsed.map((novel) => ({
          ...novel,
          characterRelationships: novel.characterRelationships ?? [],
          characterPositions: novel.characterPositions ?? {},
          sections: migrateSections(novel.sections)
        }))
      : [getSeedNovel()];
  } catch {
    window.localStorage.removeItem(storageKey);
    return [getSeedNovel()];
  }
}

export function NovelWorkspace() {
  const graphCanvasRef = React.useRef<HTMLDivElement | null>(null);
  const seedNovel = React.useMemo(() => getSeedNovel(), []);
  const [novels, setNovels] = React.useState<EditableNovel[]>([seedNovel]);
  const [selectedNovelId, setSelectedNovelId] = React.useState(seedNovel.id);
  const [selectedSectionId, setSelectedSectionId] = React.useState(seedNovel.sections[0]?.id ?? '');
  const [selectedEntryId, setSelectedEntryId] = React.useState(
    seedNovel.sections[0]?.entries[0]?.id ?? ''
  );
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('saved');
  const [savedAt, setSavedAt] = React.useState('Not saved this session');
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false);
  const [draggingNovelId, setDraggingNovelId] = React.useState<string | null>(null);
  const [draggingSectionId, setDraggingSectionId] = React.useState<string | null>(null);
  const [draggingEntryId, setDraggingEntryId] = React.useState<string | null>(null);
  const [draggingGraphNodeId, setDraggingGraphNodeId] = React.useState<string | null>(null);
  const [relationshipFromId, setRelationshipFromId] = React.useState('');
  const [relationshipToId, setRelationshipToId] = React.useState('');
  const [relationshipLabel, setRelationshipLabel] = React.useState('关系待补充');

  const selectedNovel = novels.find((novel) => novel.id === selectedNovelId) ?? novels[0];
  const selectedSection =
    selectedNovel?.sections.find((section) => section.id === selectedSectionId) ??
    selectedNovel?.sections[0];
  const selectedEntry =
    selectedSection?.entries.find((entry) => entry.id === selectedEntryId) ??
    selectedSection?.entries[0];
  const isCharactersSection = selectedSection?.id === 'characters';
  const isWorldSection = selectedSection?.id === 'world';
  const characterEntries = React.useMemo(
    () => (isCharactersSection && selectedSection ? selectedSection.entries : []),
    [isCharactersSection, selectedSection]
  );
  const centerCharacter =
    characterEntries.find((entry) => entry.id === 'ling-xi') ?? characterEntries[0];
  const characterRelationships = selectedNovel?.characterRelationships ?? [];
  const shownRelationships = characterRelationships.filter((relationship) =>
    characterEntries.some((entry) => entry.id === relationship.fromId) &&
    characterEntries.some((entry) => entry.id === relationship.toId)
  );
  const graphCharacters = centerCharacter
    ? [centerCharacter, ...characterEntries.filter((entry) => entry.id !== centerCharacter.id)]
    : [];
  const fallbackRelationships = centerCharacter
    ? characterEntries
        .filter((entry) => entry.id !== centerCharacter.id)
        .map((entry, index) => ({
          id: `fallback-${entry.id}`,
          fromId: centerCharacter.id,
          toId: entry.id,
          label: relationshipLabels[index % relationshipLabels.length]
        }))
    : [];
  const graphRelationships = [
    ...shownRelationships,
    ...fallbackRelationships.filter(
      (fallbackRelationship) =>
        !shownRelationships.some(
          (relationship) =>
            (relationship.fromId === fallbackRelationship.fromId &&
              relationship.toId === fallbackRelationship.toId) ||
            (relationship.fromId === fallbackRelationship.toId &&
              relationship.toId === fallbackRelationship.fromId)
        )
    )
  ];
  const addEntryLabel = isCharactersSection ? '+ 新人物' : isWorldSection ? '+ 表格' : '+ Chapter';

  React.useEffect(() => {
    const savedNovels = loadSavedNovels();
    const firstNovel = savedNovels[0];
    const firstSection = firstNovel?.sections[0];

    setNovels(savedNovels);
    setSelectedNovelId(firstNovel?.id ?? '');
    setSelectedSectionId(firstSection?.id ?? '');
    setSelectedEntryId(firstSection?.entries[0]?.id ?? '');
    setSaveStatus('saved');
  }, []);

  React.useEffect(() => {
    if (!selectedNovel) {
      return;
    }

    const stillHasSection = selectedNovel.sections.some((section) => section.id === selectedSectionId);

    if (!stillHasSection) {
      const firstSection = selectedNovel.sections[0];
      setSelectedSectionId(firstSection?.id ?? '');
      setSelectedEntryId(firstSection?.entries[0]?.id ?? '');
    }
  }, [selectedNovel, selectedSectionId]);

  React.useEffect(() => {
    if (!selectedSection) {
      return;
    }

    const stillHasEntry = selectedSection.entries.some((entry) => entry.id === selectedEntryId);

    if (!stillHasEntry) {
      setSelectedEntryId(selectedSection.entries[0]?.id ?? '');
    }
  }, [selectedEntryId, selectedSection]);

  React.useEffect(() => {
    if (!isCharactersSection || !centerCharacter) {
      return;
    }

    setRelationshipFromId((currentId) =>
      characterEntries.some((entry) => entry.id === currentId) ? currentId : centerCharacter.id
    );
    setRelationshipToId((currentId) => {
      if (characterEntries.some((entry) => entry.id === currentId && entry.id !== centerCharacter.id)) {
        return currentId;
      }

      return characterEntries.find((entry) => entry.id !== centerCharacter.id)?.id ?? centerCharacter.id;
    });
  }, [centerCharacter, characterEntries, isCharactersSection]);

  function markUnsaved() {
    setSaveStatus('unsaved');
  }

  function saveLibrary() {
    window.localStorage.setItem(storageKey, JSON.stringify(novels));
    setSaveStatus('saved');
    setSavedAt(new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date()));
  }

  function updateNovelById(novelId: string, updates: Partial<EditableNovel>) {
    markUnsaved();
    setNovels((currentNovels) =>
      currentNovels.map((novel) => (novel.id === novelId ? { ...novel, ...updates } : novel))
    );
  }

  function updateEntry(updates: Partial<NovelEntry>) {
    if (!selectedNovel || !selectedSection || !selectedEntry) {
      return;
    }

    markUnsaved();
    setNovels((currentNovels) =>
      currentNovels.map((novel) =>
        novel.id === selectedNovel.id
          ? {
              ...novel,
              sections: novel.sections.map((section) =>
                section.id === selectedSection.id
                  ? {
                      ...section,
                      entries: section.entries.map((entry) =>
                        entry.id === selectedEntry.id ? { ...entry, ...updates } : entry
                      )
                    }
                  : section
              )
            }
          : novel
      )
    );
  }

  function updateEntryById(entryId: string, updates: Partial<NovelEntry>) {
    if (!selectedNovel || !selectedSection) {
      return;
    }

    markUnsaved();
    setNovels((currentNovels) =>
      currentNovels.map((novel) =>
        novel.id === selectedNovel.id
          ? {
              ...novel,
              sections: novel.sections.map((section) =>
                section.id === selectedSection.id
                  ? {
                      ...section,
                      entries: section.entries.map((entry) =>
                        entry.id === entryId ? { ...entry, ...updates } : entry
                      )
                    }
                  : section
              )
            }
          : novel
      )
    );
  }

  function updateSectionById(sectionId: string, updates: Partial<EditableSection>) {
    if (!selectedNovel) {
      return;
    }

    markUnsaved();
    setNovels((currentNovels) =>
      currentNovels.map((novel) =>
        novel.id === selectedNovel.id
          ? {
              ...novel,
              sections: novel.sections.map((section) =>
                section.id === sectionId ? { ...section, ...updates } : section
              )
            }
          : novel
      )
    );
  }

  function addNovel() {
    const novel = createNovel();
    const firstSection = novel.sections[0];

    markUnsaved();
    setNovels((currentNovels) => [novel, ...currentNovels]);
    setSelectedNovelId(novel.id);
    setSelectedSectionId(firstSection?.id ?? '');
    setSelectedEntryId(firstSection?.entries[0]?.id ?? '');
  }

  function deleteNovel() {
    if (!selectedNovel) {
      return;
    }

    markUnsaved();
    setNovels((currentNovels) => {
      const nextNovels = currentNovels.filter((novel) => novel.id !== selectedNovel.id);
      const fallbackNovel = nextNovels[0];
      const fallbackSection = fallbackNovel?.sections[0];
      setSelectedNovelId(fallbackNovel?.id ?? '');
      setSelectedSectionId(fallbackSection?.id ?? '');
      setSelectedEntryId(fallbackSection?.entries[0]?.id ?? '');
      return nextNovels;
    });
  }

  function moveNovelToTarget(draggedNovelId: string, targetNovelId: string) {
    if (draggedNovelId === targetNovelId) {
      return;
    }

    setNovels((currentNovels) => {
      const currentIndex = currentNovels.findIndex((novel) => novel.id === draggedNovelId);
      const targetIndex = currentNovels.findIndex((novel) => novel.id === targetNovelId);

      if (currentIndex < 0 || targetIndex < 0) {
        return currentNovels;
      }

      const nextNovels = [...currentNovels];
      const [movingNovel] = nextNovels.splice(currentIndex, 1);
      nextNovels.splice(targetIndex, 0, movingNovel);
      markUnsaved();

      return nextNovels;
    });
  }

  function handleNovelDragStart(event: React.DragEvent<HTMLDivElement>, novelId: string) {
    if (event.target instanceof HTMLElement && event.target.closest('input, textarea, button')) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', novelId);
    setDraggingNovelId(novelId);
  }

  function handleNovelDrop(event: React.DragEvent<HTMLDivElement>, targetNovelId: string) {
    event.preventDefault();
    const draggedNovelId = event.dataTransfer.getData('text/plain') || draggingNovelId;

    if (draggedNovelId) {
      moveNovelToTarget(draggedNovelId, targetNovelId);
    }

    setDraggingNovelId(null);
  }

  function moveSectionToTarget(draggedSectionId: string, targetSectionId: string) {
    if (!selectedNovel || draggedSectionId === targetSectionId) {
      return;
    }

    setNovels((currentNovels) =>
      currentNovels.map((novel) => {
        if (novel.id !== selectedNovel.id) {
          return novel;
        }

        const currentIndex = novel.sections.findIndex((section) => section.id === draggedSectionId);
        const targetIndex = novel.sections.findIndex((section) => section.id === targetSectionId);

        if (currentIndex < 0 || targetIndex < 0) {
          return novel;
        }

        const nextSections = [...novel.sections];
        const [movingSection] = nextSections.splice(currentIndex, 1);
        nextSections.splice(targetIndex, 0, movingSection);
        markUnsaved();

        return { ...novel, sections: nextSections };
      })
    );
  }

  function handleSectionDragStart(event: React.DragEvent<HTMLElement>, sectionId: string) {
    if (event.target instanceof HTMLElement && event.target.closest('input, textarea, button')) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', sectionId);
    setDraggingSectionId(sectionId);
  }

  function handleSectionDrop(event: React.DragEvent<HTMLElement>, targetSectionId: string) {
    event.preventDefault();
    const draggedSectionId = event.dataTransfer.getData('text/plain') || draggingSectionId;

    if (draggedSectionId) {
      moveSectionToTarget(draggedSectionId, targetSectionId);
    }

    setDraggingSectionId(null);
  }

  function moveEntryToTarget(draggedEntryId: string, targetEntryId: string) {
    if (!selectedNovel || !selectedSection || draggedEntryId === targetEntryId) {
      return;
    }

    setNovels((currentNovels) =>
      currentNovels.map((novel) => {
        if (novel.id !== selectedNovel.id) {
          return novel;
        }

        return {
          ...novel,
          sections: novel.sections.map((section) => {
            if (section.id !== selectedSection.id) {
              return section;
            }

            const currentIndex = section.entries.findIndex((entry) => entry.id === draggedEntryId);
            const targetIndex = section.entries.findIndex((entry) => entry.id === targetEntryId);

            if (currentIndex < 0 || targetIndex < 0) {
              return section;
            }

            const nextEntries = [...section.entries];
            const [movingEntry] = nextEntries.splice(currentIndex, 1);
            nextEntries.splice(targetIndex, 0, movingEntry);
            markUnsaved();

            return { ...section, entries: nextEntries };
          })
        };
      })
    );
  }

  function handleEntryDragStart(event: React.DragEvent<HTMLElement>, entryId: string) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', entryId);
    setDraggingEntryId(entryId);
  }

  function handleEntryDrop(event: React.DragEvent<HTMLElement>, targetEntryId: string) {
    event.preventDefault();
    const draggedEntryId = event.dataTransfer.getData('text/plain') || draggingEntryId;

    if (draggedEntryId) {
      moveEntryToTarget(draggedEntryId, targetEntryId);
    }

    setDraggingEntryId(null);
  }

  function addCharacterRelationship(fromId: string, toId: string, label: string) {
    if (!selectedNovel || !fromId || !toId || fromId === toId) {
      return;
    }

    const relationship: CharacterRelationship = {
      id: createId('relationship'),
      fromId,
      toId,
      label: label.trim() || '关系待补充'
    };

    markUnsaved();
    setNovels((currentNovels) =>
      currentNovels.map((novel) =>
        novel.id === selectedNovel.id
          ? {
              ...novel,
              characterRelationships: [...(novel.characterRelationships ?? []), relationship]
            }
          : novel
      )
    );
  }

  function deleteCharacterRelationship(relationshipId: string) {
    if (!selectedNovel) {
      return;
    }

    markUnsaved();
    setNovels((currentNovels) =>
      currentNovels.map((novel) =>
        novel.id === selectedNovel.id
          ? {
              ...novel,
              characterRelationships: (novel.characterRelationships ?? []).filter(
                (relationship) => relationship.id !== relationshipId
              )
            }
          : novel
      )
    );
  }

  function getCharacterGraphPosition(entryId: string, index: number) {
    return selectedNovel?.characterPositions?.[entryId] ?? getGraphNodePosition(index, graphCharacters.length);
  }

  function updateCharacterGraphPosition(entryId: string, position: CharacterPosition) {
    if (!selectedNovel) {
      return;
    }

    markUnsaved();
    setNovels((currentNovels) =>
      currentNovels.map((novel) =>
        novel.id === selectedNovel.id
          ? {
              ...novel,
              characterPositions: {
                ...novel.characterPositions,
                [entryId]: position
              }
            }
          : novel
      )
    );
  }

  function handleGraphNodePointerDown(event: React.PointerEvent<HTMLButtonElement>, entryId: string) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedEntryId(entryId);
    setDraggingGraphNodeId(entryId);
  }

  function handleGraphPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingGraphNodeId || !graphCanvasRef.current) {
      return;
    }

    const bounds = graphCanvasRef.current.getBoundingClientRect();
    const x = Math.min(96, Math.max(4, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.min(98, Math.max(2, ((event.clientY - bounds.top) / bounds.height) * 100));

    updateCharacterGraphPosition(draggingGraphNodeId, { x, y });
  }

  function stopGraphNodeDrag() {
    setDraggingGraphNodeId(null);
  }

  function addSection() {
    if (!selectedNovel) {
      return;
    }

    const section = createSection();

    markUnsaved();
    setNovels((currentNovels) =>
      currentNovels.map((novel) =>
        novel.id === selectedNovel.id ? { ...novel, sections: [...novel.sections, section] } : novel
      )
    );
    setSelectedSectionId(section.id);
    setSelectedEntryId('');
  }

  function deleteSection() {
    if (!selectedNovel || !selectedSection) {
      return;
    }

    markUnsaved();
    setNovels((currentNovels) =>
      currentNovels.map((novel) =>
        novel.id === selectedNovel.id
          ? {
              ...novel,
              sections: novel.sections.filter((section) => section.id !== selectedSection.id)
            }
          : novel
      )
    );
  }

  function addEntry() {
    if (!selectedNovel || !selectedSection) {
      return;
    }

    const entry = isCharactersSection
      ? createCharacterEntry()
      : isWorldSection
        ? createWorldTableEntry()
        : createEntry(getSectionDisplayLabel(selectedSection));

    markUnsaved();
    setNovels((currentNovels) =>
      currentNovels.map((novel) =>
        novel.id === selectedNovel.id
          ? {
              ...novel,
              characterRelationships:
                isCharactersSection && centerCharacter
                  ? [
                      ...(novel.characterRelationships ?? []),
                      {
                        id: createId('relationship'),
                        fromId: centerCharacter.id,
                        toId: entry.id,
                        label: '关系待补充'
                      }
                    ]
                  : novel.characterRelationships,
              sections: novel.sections.map((section) =>
                section.id === selectedSection.id
                  ? { ...section, entries: [...section.entries, entry] }
                  : section
              )
            }
          : novel
      )
    );
    setSelectedEntryId(entry.id);
  }

  function deleteEntry() {
    if (!selectedNovel || !selectedSection || !selectedEntry) {
      return;
    }

    markUnsaved();
    setNovels((currentNovels) =>
      currentNovels.map((novel) =>
        novel.id === selectedNovel.id
          ? {
              ...novel,
              sections: novel.sections.map((section) =>
                section.id === selectedSection.id
                  ? {
                      ...section,
                      entries: section.entries.filter((entry) => entry.id !== selectedEntry.id)
                    }
                  : section
              )
            }
          : novel
      )
    );
  }

  function deleteEntryById(entryId: string) {
    if (!selectedNovel || !selectedSection) {
      return;
    }

    markUnsaved();
    setNovels((currentNovels) =>
      currentNovels.map((novel) =>
        novel.id === selectedNovel.id
          ? {
              ...novel,
              sections: novel.sections.map((section) =>
                section.id === selectedSection.id
                  ? {
                      ...section,
                      entries: section.entries.filter((entry) => entry.id !== entryId)
                    }
                  : section
              )
            }
          : novel
      )
    );

    if (selectedEntryId === entryId) {
      const nextEntry = selectedSection.entries.find((entry) => entry.id !== entryId);
      setSelectedEntryId(nextEntry?.id ?? '');
    }
  }

  function updateTags(value: string) {
    updateEntry({
      tags: value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    });
  }

  function addTag() {
    updateEntry({
      tags: [...(selectedEntry?.tags ?? []), 'new-tag']
    });
  }

  function deleteTag(index: number) {
    updateEntry({
      tags: (selectedEntry?.tags ?? []).filter((_, tagIndex) => tagIndex !== index)
    });
  }

  function addField() {
    updateEntry({
      fields: [...(selectedEntry?.fields ?? []), { label: 'New field', value: 'Value' }]
    });
  }

  function updateField(index: number, key: 'label' | 'value', value: string) {
    const nextFields = [...(selectedEntry?.fields ?? [])];
    nextFields[index] = { ...nextFields[index], [key]: value };
    updateEntry({ fields: nextFields });
  }

  function deleteField(index: number) {
    updateEntry({
      fields: (selectedEntry?.fields ?? []).filter((_, fieldIndex) => fieldIndex !== index)
    });
  }

  function addWorldTableRow(entry: NovelEntry) {
    const rows = [...getWorldTableRows(entry), { label: '新项目', value: '说明' }];
    updateEntryById(entry.id, {
      fields: rows,
      content: serializeWorldTableRows(rows)
    });
  }

  function updateWorldTableRow(
    entry: NovelEntry,
    index: number,
    key: 'label' | 'value',
    value: string
  ) {
    const rows = [...getWorldTableRows(entry)];
    rows[index] = { ...rows[index], [key]: value };
    updateEntryById(entry.id, {
      fields: rows,
      content: serializeWorldTableRows(rows)
    });
  }

  function deleteWorldTableRow(entry: NovelEntry, index: number) {
    const rows = getWorldTableRows(entry).filter((_, rowIndex) => rowIndex !== index);
    updateEntryById(entry.id, {
      fields: rows,
      content: serializeWorldTableRows(rows)
    });
  }

  function selectNovel(novel: EditableNovel) {
    const firstSection = novel.sections[0];
    setSelectedNovelId(novel.id);
    setSelectedSectionId(firstSection?.id ?? '');
    setSelectedEntryId(firstSection?.entries[0]?.id ?? '');
  }

  function selectSection(section: EditableSection) {
    setSelectedSectionId(section.id);
    setSelectedEntryId(section.entries[0]?.id ?? '');
  }

  const libraryPanel = (
    <div className='flex min-h-0 flex-col gap-5'>
      <div className='space-y-3 rounded-2xl border border-[#d7e8ee] bg-[#f7fbfd] p-4'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <p className='text-sm font-medium text-[#496761]'>作品库</p>
            <h2 className='text-lg font-semibold text-[#12342f]'>Novels</h2>
          </div>
          <Button
            className='size-9 rounded-full bg-[#173f38] text-lg text-white hover:bg-[#22584f]'
            onClick={addNovel}
            size='icon'
            type='button'
          >
            +
          </Button>
        </div>
        <ScrollArea className='h-44 pr-3'>
          <div className='space-y-2'>
            {novels.map((novel) => (
              <div
                key={novel.id}
                aria-label={`Select and drag ${novel.title}`}
                className={
                  novel.id === selectedNovel?.id
                    ? 'cursor-grab rounded-2xl border border-[#b7d4cd] bg-[#dbe9df]/90 p-3 shadow-sm transition active:cursor-grabbing'
                    : 'cursor-grab rounded-2xl border border-[#d7e8ee] bg-white/65 p-3 shadow-sm transition hover:bg-white/80 active:cursor-grabbing'
                }
                draggable
                onClick={() => selectNovel(novel)}
                onDragEnd={() => setDraggingNovelId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={(event) => handleNovelDragStart(event, novel.id)}
                onDrop={(event) => handleNovelDrop(event, novel.id)}
                onKeyDown={(event) => {
                  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, button')) {
                    return;
                  }

                  if (event.key === 'Enter' || event.key === ' ') {
                    selectNovel(novel);
                  }
                }}
                role='button'
                style={{ opacity: draggingNovelId === novel.id ? 0.55 : 1 }}
                tabIndex={0}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0 flex-1 space-y-2'>
                    <Input
                      className={
                        novel.id === selectedNovel?.id
                          ? 'h-9 rounded-xl border-[#b7d4cd]/80 bg-white/35 font-semibold shadow-none focus-visible:bg-white/65'
                          : 'h-9 rounded-xl border-[#d7e8ee] bg-white/45 font-semibold shadow-none focus-visible:bg-white/75'
                      }
                      onChange={(event) => updateNovelById(novel.id, { title: event.target.value })}
                      onClick={(event) => event.stopPropagation()}
                      onFocus={() => selectNovel(novel)}
                      value={novel.title}
                    />
                    <Textarea
                      className={
                        novel.id === selectedNovel?.id
                          ? 'min-h-16 resize-none rounded-xl border-[#b7d4cd]/80 bg-white/30 text-sm text-[#496761] shadow-none focus-visible:bg-white/65'
                          : 'min-h-16 resize-none rounded-xl border-[#d7e8ee] bg-white/40 text-sm text-[#496761] shadow-none focus-visible:bg-white/75'
                      }
                      onChange={(event) => updateNovelById(novel.id, { subtitle: event.target.value })}
                      onClick={(event) => event.stopPropagation()}
                      onFocus={() => selectNovel(novel)}
                      value={novel.subtitle}
                    />
                  </div>
                  {novel.id === selectedNovel?.id ? (
                    <div className='flex shrink-0 items-start'>
                      <button
                        className='rounded-full border border-[#d7a5a5]/80 bg-white/45 px-3 py-1 text-xs font-medium text-[#8a2d2d] hover:bg-white/75'
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteNovel();
                        }}
                        type='button'
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {selectedNovel ? (
        <div className='rounded-2xl border border-[#d7e8ee] bg-[#f7fbfd] p-4'>
          <div className='flex items-center justify-between gap-2'>
            <h3 className='text-sm font-semibold text-[#496761]'>Modules</h3>
            <Button
              className='h-8 rounded-full bg-[#173f38] px-3 text-white hover:bg-[#22584f]'
              onClick={addSection}
              type='button'
            >
              + Add
            </Button>
          </div>
          <ScrollArea className='mt-3 h-80 pr-3'>
            <div className='space-y-2'>
              {selectedNovel.sections.map((section) => (
                <div
                  key={section.id}
                  aria-label={`Select and drag ${getSectionDisplayLabel(section)}`}
                  className={
                    section.id === selectedSection?.id
                      ? 'w-full cursor-grab rounded-2xl bg-[#173f38] px-4 py-3 text-left shadow-sm active:cursor-grabbing'
                      : 'w-full cursor-grab rounded-2xl px-4 py-3 text-left transition-colors hover:bg-white active:cursor-grabbing'
                  }
                  draggable
                  onClick={() => selectSection(section)}
                  onDragEnd={() => setDraggingSectionId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={(event) => handleSectionDragStart(event, section.id)}
                  onDrop={(event) => handleSectionDrop(event, section.id)}
                  onKeyDown={(event) => {
                    if (event.target instanceof HTMLElement && event.target.closest('input, textarea, button')) {
                      return;
                    }

                    if (event.key === 'Enter' || event.key === ' ') {
                      selectSection(section);
                    }
                  }}
                  role='button'
                  style={{ opacity: draggingSectionId === section.id ? 0.55 : 1 }}
                  tabIndex={0}
                >
                  <Input
                    className={
                      section.id === selectedSection?.id
                        ? 'h-8 border-transparent bg-transparent px-0 text-sm font-semibold text-white shadow-none focus-visible:border-white/25 focus-visible:bg-white/10 focus-visible:ring-0'
                        : 'h-8 border-transparent bg-transparent px-0 text-sm font-medium text-[#173f38]/80 shadow-none focus-visible:border-[#d7e8ee] focus-visible:bg-white/45 focus-visible:ring-0'
                    }
                    onChange={(event) => updateSectionById(section.id, { label: event.target.value })}
                    onClick={(event) => event.stopPropagation()}
                    onFocus={() => selectSection(section)}
                    value={getSectionDisplayLabel(section)}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : null}
    </div>
  );

  return (
    <section className='min-h-[760px] space-y-5'>
      <div className='flex flex-col gap-3 rounded-[1.5rem] border border-white/70 bg-white/82 p-3 text-[#12342f] shadow-[0_18px_50px_rgba(32,86,120,0.12)] backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex min-w-0 items-center gap-3'>
          <Sheet open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
            <SheetTrigger asChild>
              <Button
                className='size-11 rounded-full bg-[#173f38] text-xl text-white hover:bg-[#22584f]'
                size='icon'
                type='button'
              >
                <span className='grid gap-1' aria-hidden='true'>
                  <span className='block h-0.5 w-5 rounded-full bg-current' />
                  <span className='block h-0.5 w-5 rounded-full bg-current' />
                  <span className='block h-0.5 w-5 rounded-full bg-current' />
                </span>
                <span className='sr-only'>Open novel library</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              className='flex h-full w-[88vw] flex-col overflow-hidden border-white/60 bg-[#eef7fb] p-4 text-[#12342f] sm:w-[50vw] sm:min-w-[420px] sm:max-w-[680px]'
              side='left'
            >
              <SheetHeader className='shrink-0 pt-0'>
                <SheetTitle className='text-[#12342f]'>Novel Library</SheetTitle>
                <SheetDescription className='text-[#496761]'>
                  Jump between novels, modules, and chapters.
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className='min-h-0 flex-1 pr-3'>
                <div className='pb-6'>{libraryPanel}</div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <div className='min-w-0'>
            <p className='truncate text-sm text-[#496761]'>
              {selectedNovel?.title ?? 'No novel'} / {getSectionDisplayLabel(selectedSection)}
            </p>
            <h2 className='truncate text-xl font-semibold'>{selectedEntry?.title ?? 'No entry selected'}</h2>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Badge
            className={
              saveStatus === 'saved'
                ? 'border-transparent bg-[#dbe9df] text-[#173f38]'
                : 'border-transparent bg-[#fff2c7] text-[#725100]'
            }
          >
            {saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
          </Badge>
          <span className='text-xs text-[#6b8580]'>{savedAt}</span>
          <Button
            className='rounded-full bg-[#173f38] px-5 text-white hover:bg-[#22584f]'
            onClick={saveLibrary}
            type='button'
          >
            Save
          </Button>
        </div>
      </div>

      {selectedSection ? (
      <Card className='rounded-[1.5rem] border-white/70 bg-white/82 text-[#12342f] shadow-[0_18px_50px_rgba(32,86,120,0.12)] backdrop-blur'>
          <CardContent className='space-y-5 p-5 sm:p-6'>
            <div className='flex justify-end'>
              <div className='grid gap-3 sm:grid-cols-2 lg:w-80'>
                <Button
                  className='h-12 rounded-full bg-[#173f38] text-base font-semibold text-white hover:bg-[#22584f]'
                  onClick={addEntry}
                  type='button'
                >
                  {addEntryLabel}
                </Button>
                <Button
                  className='h-12 rounded-full border-[#d7a5a5] bg-white/70 text-base font-semibold text-[#8a2d2d] hover:bg-[#fff0f0]'
                  onClick={deleteSection}
                  type='button'
                  variant='outline'
                >
                  Delete
                </Button>
              </div>
            </div>

            {isCharactersSection ? (
              <div className='space-y-5'>
                <div className='rounded-2xl border border-[#d7e8ee] bg-[#f7fbfd]/70 p-3'>
                  <div className='mb-3 flex items-center justify-between gap-3 px-2'>
                    <h3 className='text-sm font-semibold text-[#496761]'>人物设定表</h3>
                    <span className='text-xs text-[#6b8580]'>{selectedSection.entries.length} characters</span>
                  </div>
                  <ScrollArea className='h-[585px]'>
                    <div className='min-w-[920px] overflow-hidden rounded-xl border border-[#d7e8ee] bg-white/75'>
                      <table className='w-full border-collapse text-left text-sm'>
                        <thead className='bg-[#e8f1f4] text-[#496761]'>
                          <tr>
                            <th className='w-16 px-4 py-3 font-semibold'>#</th>
                            <th className='w-48 px-4 py-3 font-semibold'>人物</th>
                            <th className='w-56 px-4 py-3 font-semibold'>身份 / 定位</th>
                            <th className='px-4 py-3 font-semibold'>设定摘要</th>
                            <th className='w-64 px-4 py-3 font-semibold'>备注</th>
                          </tr>
                        </thead>
                        <tbody className='divide-y divide-[#d7e8ee]'>
                          {selectedSection.entries.map((entry, index) => (
                            <tr
                              key={entry.id}
                              draggable
                              className={
                                entry.id === selectedEntry?.id
                                  ? 'cursor-grab bg-[#dbe9df] text-[#12342f] active:cursor-grabbing'
                                  : 'cursor-grab text-[#12342f] transition-colors hover:bg-[#f7fbfd] active:cursor-grabbing'
                              }
                              onClick={() => setSelectedEntryId(entry.id)}
                              onDragEnd={() => setDraggingEntryId(null)}
                              onDragOver={(event) => event.preventDefault()}
                              onDragStart={(event) => handleEntryDragStart(event, entry.id)}
                              onDrop={(event) => handleEntryDrop(event, entry.id)}
                              style={{ opacity: draggingEntryId === entry.id ? 0.55 : 1 }}
                            >
                              <td className='px-3 py-2 align-top font-semibold text-[#6b8580]'>
                                <span className='block'>{String(index + 1).padStart(2, '0')}</span>
                              </td>
                              <td className='px-3 py-2 align-top'>
                                <span className='block rounded-lg px-2 py-2 font-semibold text-[#12342f]'>
                                  {entry.title}
                                </span>
                              </td>
                              <td className='px-4 py-4 align-top text-[#496761]'>{entry.eyebrow || '待补充'}</td>
                              <td className='px-4 py-4 align-top leading-6 text-[#496761]'>
                                {entry.summary || 'No summary yet.'}
                              </td>
                              <td className='px-4 py-4 align-top leading-6 text-[#6b8580]'>
                                {getEntryPreview(entry.content)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                  {selectedEntry ? (
                    <div className='mt-4 rounded-2xl border border-[#d7e8ee] bg-white/75 p-4'>
                      <div className='mb-3 flex items-center justify-between gap-3'>
                        <h3 className='text-sm font-semibold text-[#496761]'>Selected character editor</h3>
                        <span className='text-xs text-[#6b8580]'>Drag table rows to reorder characters</span>
                      </div>
                      <div className='grid gap-3 lg:grid-cols-[0.6fr_0.6fr_1fr]'>
                        <Input
                          className='h-11 rounded-xl border-[#d7e8ee] bg-[#f7fbfd]'
                          onChange={(event) => updateEntry({ title: event.target.value })}
                          value={selectedEntry.title}
                        />
                        <Input
                          className='h-11 rounded-xl border-[#d7e8ee] bg-[#f7fbfd]'
                          onChange={(event) => updateEntry({ eyebrow: event.target.value })}
                          value={selectedEntry.eyebrow ?? ''}
                        />
                        <Textarea
                          className='min-h-20 resize-y rounded-xl border-[#d7e8ee] bg-[#f7fbfd]'
                          onChange={(event) => updateEntry({ summary: event.target.value })}
                          value={selectedEntry.summary}
                        />
                      </div>
                      <Textarea
                        className='mt-3 min-h-28 resize-y rounded-xl border-[#d7e8ee] bg-[#f7fbfd]'
                        onChange={(event) => updateEntry({ content: event.target.value })}
                        value={selectedEntry.content}
                      />
                    </div>
                  ) : null}
                </div>

                <div className='rounded-2xl border border-[#d7e8ee] bg-[#f7fbfd]/70 p-4'>
                  <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <h3 className='text-sm font-semibold text-[#496761]'>人物关系图</h3>
                      <p className='mt-1 text-xs text-[#6b8580]'>凌汐固定为中心；新增人物会自动连到凌汐，也可以手动添加关系线。</p>
                    </div>
                    <span className='rounded-full bg-[#e8f1f4] px-3 py-1 text-xs font-medium text-[#496761]'>
                      {graphRelationships.length} lines
                    </span>
                  </div>

                  <div className='mb-4 grid gap-3 rounded-2xl border border-[#d7e8ee] bg-white/75 p-3 lg:grid-cols-[1fr_1fr_1.2fr_auto]'>
                    <select
                      className='h-10 rounded-xl border border-[#d7e8ee] bg-[#f7fbfd] px-3 text-sm text-[#12342f]'
                      onChange={(event) => setRelationshipFromId(event.target.value)}
                      value={relationshipFromId}
                    >
                      {characterEntries.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.title}
                        </option>
                      ))}
                    </select>
                    <select
                      className='h-10 rounded-xl border border-[#d7e8ee] bg-[#f7fbfd] px-3 text-sm text-[#12342f]'
                      onChange={(event) => setRelationshipToId(event.target.value)}
                      value={relationshipToId}
                    >
                      {characterEntries.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.title}
                        </option>
                      ))}
                    </select>
                    <Input
                      className='h-10 rounded-xl border-[#d7e8ee] bg-[#f7fbfd]'
                      onChange={(event) => setRelationshipLabel(event.target.value)}
                      placeholder='Relationship, e.g. mentor / friend / rival'
                      value={relationshipLabel}
                    />
                    <Button
                      className='h-10 rounded-full bg-[#173f38] px-5 text-white hover:bg-[#22584f]'
                      onClick={() => addCharacterRelationship(relationshipFromId, relationshipToId, relationshipLabel)}
                      type='button'
                    >
                      + Line
                    </Button>
                  </div>

                  <div
                    ref={graphCanvasRef}
                    className='relative min-h-[1000px] touch-none select-none overflow-hidden rounded-2xl border border-[#d7e8ee] bg-white/80'
                    onPointerLeave={stopGraphNodeDrag}
                    onPointerMove={handleGraphPointerMove}
                    onPointerUp={stopGraphNodeDrag}
                  >
                    <svg className='pointer-events-none absolute inset-0 size-full' viewBox='0 0 100 100' preserveAspectRatio='none'>
                      {graphRelationships.map((relationship) => {
                        const fromIndex = graphCharacters.findIndex((entry) => entry.id === relationship.fromId);
                        const toIndex = graphCharacters.findIndex((entry) => entry.id === relationship.toId);
                        const from = getCharacterGraphPosition(relationship.fromId, fromIndex);
                        const to = getCharacterGraphPosition(relationship.toId, toIndex);

                        if (fromIndex < 0 || toIndex < 0) {
                          return null;
                        }

                        return (
                          <g key={relationship.id}>
                            <line
                              stroke='#9fc6be'
                              strokeDasharray={relationship.id.startsWith('fallback-') ? '2 2' : undefined}
                              strokeWidth='2'
                              vectorEffect='non-scaling-stroke'
                              x1={from.x}
                              x2={to.x}
                              y1={from.y}
                              y2={to.y}
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {graphRelationships.map((relationship) => {
                      const fromIndex = graphCharacters.findIndex((entry) => entry.id === relationship.fromId);
                      const toIndex = graphCharacters.findIndex((entry) => entry.id === relationship.toId);

                      if (fromIndex < 0 || toIndex < 0) {
                        return null;
                      }

                      const from = getCharacterGraphPosition(relationship.fromId, fromIndex);
                      const to = getCharacterGraphPosition(relationship.toId, toIndex);
                      const labelX = (from.x + to.x) / 2;
                      const labelY = (from.y + to.y) / 2;

                      return (
                        <span
                          key={`label-${relationship.id}`}
                          className='pointer-events-none absolute max-w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#b7d4cd] bg-white/90 px-2 py-0.5 text-center text-[11px] font-medium leading-4 text-[#496761] shadow-sm'
                          style={{ left: `${labelX}%`, top: `${labelY}%` }}
                        >
                          {relationship.label}
                        </span>
                      );
                    })}

                    {graphCharacters.map((entry, index) => {
                      const position = getCharacterGraphPosition(entry.id, index);
                      const isCenter = entry.id === centerCharacter?.id;
                      const relation = shownRelationships.find(
                        (relationship) => relationship.fromId === entry.id || relationship.toId === entry.id
                      );

                      return (
                        <button
                          key={entry.id}
                          className={
                            isCenter
                              ? 'absolute w-44 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full bg-[#173f38] px-5 py-4 text-center text-white shadow-sm transition hover:bg-[#22584f]'
                              : entry.id === selectedEntry?.id
                                ? 'absolute w-36 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-xl border border-[#b7d4cd] bg-[#dbe9df] px-3 py-3 text-left shadow-sm'
                                : 'absolute w-36 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-xl border border-[#d7e8ee] bg-[#f7fbfd] px-3 py-3 text-left transition-colors hover:bg-white'
                          }
                          onClick={() => setSelectedEntryId(entry.id)}
                          onPointerDown={(event) => handleGraphNodePointerDown(event, entry.id)}
                          style={{ left: `${position.x}%`, top: `${position.y}%` }}
                          type='button'
                        >
                          <span className={isCenter ? 'block text-xs font-semibold uppercase tracking-[0.18em] text-white/70' : 'block text-[11px] font-semibold text-[#6b8580]'}>
                            {isCenter ? 'Center' : relation?.label ?? '关系待补充'}
                          </span>
                          <span className={isCenter ? 'mt-1 block truncate text-xl font-semibold' : 'mt-1 block truncate text-sm font-semibold text-[#12342f]'}>
                            {entry.title}
                          </span>
                          <span className={isCenter ? 'mt-2 block line-clamp-2 text-xs leading-5 text-white/80' : 'mt-1 block line-clamp-2 text-xs leading-5 text-[#496761]'}>
                            {entry.eyebrow || entry.summary || '待补充'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {shownRelationships.length ? (
                    <div className='mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3'>
                      {shownRelationships.map((relationship) => {
                        const from = characterEntries.find((entry) => entry.id === relationship.fromId);
                        const to = characterEntries.find((entry) => entry.id === relationship.toId);

                        return (
                          <div key={relationship.id} className='flex items-center justify-between gap-3 rounded-xl border border-[#d7e8ee] bg-white/75 px-3 py-2 text-sm text-[#496761]'>
                            <span className='min-w-0 truncate'>
                              {from?.title} - {relationship.label} - {to?.title}
                            </span>
                            <button
                              className='shrink-0 rounded-full px-2 py-1 text-xs text-[#8a2d2d] hover:bg-[#fff0f0]'
                              onClick={() => deleteCharacterRelationship(relationship.id)}
                              type='button'
                            >
                              Delete
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : isWorldSection ? (
              <div className='space-y-4'>
                <div className='flex items-center justify-between gap-3 rounded-2xl border border-[#d7e8ee] bg-[#f7fbfd]/70 px-4 py-3'>
                  <div>
                    <h3 className='text-sm font-semibold text-[#496761]'>世界观设定表</h3>
                    <p className='mt-1 text-xs text-[#6b8580]'>每个分类独立成表，可以直接编辑项目和说明。</p>
                  </div>
                  <span className='text-xs text-[#6b8580]'>{selectedSection.entries.length} tables</span>
                </div>

                <div className='grid gap-4 xl:grid-cols-2'>
                  {selectedSection.entries.map((entry) => {
                    const rows = getWorldTableRows(entry);

                    return (
                      <div
                        key={entry.id}
                        aria-label={`Select and drag ${entry.title}`}
                        className={
                          entry.id === selectedEntry?.id
                            ? 'cursor-grab rounded-2xl border border-[#b7d4cd] bg-[#dbe9df]/75 p-4 shadow-sm active:cursor-grabbing'
                            : 'cursor-grab rounded-2xl border border-[#d7e8ee] bg-[#f7fbfd]/75 p-4 shadow-sm transition-colors hover:bg-white/80 active:cursor-grabbing'
                        }
                        draggable
                        onClick={() => setSelectedEntryId(entry.id)}
                        onDragEnd={() => setDraggingEntryId(null)}
                        onDragOver={(event) => event.preventDefault()}
                        onDragStart={(event) => handleEntryDragStart(event, entry.id)}
                        onDrop={(event) => handleEntryDrop(event, entry.id)}
                        onKeyDown={(event) => {
                          if (event.target instanceof HTMLElement && event.target.closest('input, textarea, button')) {
                            return;
                          }

                          if (event.key === 'Enter' || event.key === ' ') {
                            setSelectedEntryId(entry.id);
                          }
                        }}
                        role='button'
                        style={{ opacity: draggingEntryId === entry.id ? 0.55 : 1 }}
                        tabIndex={0}
                      >
                        <div className='mb-3 grid gap-2 md:grid-cols-[1fr_0.7fr_auto]'>
                          <Input
                            className='h-10 rounded-xl border-[#d7e8ee] bg-white/65 font-semibold'
                            onChange={(event) => updateEntryById(entry.id, { title: event.target.value })}
                            onClick={(event) => event.stopPropagation()}
                            onFocus={() => setSelectedEntryId(entry.id)}
                            value={entry.title}
                          />
                          <Input
                            className='h-10 rounded-xl border-[#d7e8ee] bg-white/65'
                            onChange={(event) => updateEntryById(entry.id, { eyebrow: event.target.value })}
                            onClick={(event) => event.stopPropagation()}
                            onFocus={() => setSelectedEntryId(entry.id)}
                            value={entry.eyebrow ?? ''}
                          />
                          <Button
                            className='h-10 rounded-full border-[#d7a5a5] bg-white/55 px-4 text-[#8a2d2d] hover:bg-[#fff0f0]'
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteEntryById(entry.id);
                            }}
                            type='button'
                            variant='outline'
                          >
                            Delete
                          </Button>
                        </div>

                        <Textarea
                          className='mb-3 min-h-16 resize-y rounded-xl border-[#d7e8ee] bg-white/55 text-sm'
                          onChange={(event) => updateEntryById(entry.id, { summary: event.target.value })}
                          onClick={(event) => event.stopPropagation()}
                          onFocus={() => setSelectedEntryId(entry.id)}
                          value={entry.summary}
                        />

                        <div className='overflow-hidden rounded-xl border border-[#d7e8ee] bg-white/70'>
                          <table className='w-full border-collapse text-left text-sm'>
                            <thead className='bg-[#e8f1f4] text-[#496761]'>
                              <tr>
                                <th className='w-[34%] px-3 py-2 font-semibold'>项目</th>
                                <th className='px-3 py-2 font-semibold'>说明</th>
                                <th className='w-20 px-3 py-2 font-semibold'>操作</th>
                              </tr>
                            </thead>
                            <tbody className='divide-y divide-[#d7e8ee]'>
                              {rows.map((row, rowIndex) => (
                                <tr key={`${entry.id}-${rowIndex}`}>
                                  <td className='p-2 align-top'>
                                    <Input
                                      className='h-9 rounded-lg border-[#d7e8ee] bg-[#f7fbfd]/80 font-medium'
                                      onChange={(event) =>
                                        updateWorldTableRow(entry, rowIndex, 'label', event.target.value)
                                      }
                                      onClick={(event) => event.stopPropagation()}
                                      value={row.label}
                                    />
                                  </td>
                                  <td className='p-2 align-top'>
                                    <Textarea
                                      className='min-h-9 resize-y rounded-lg border-[#d7e8ee] bg-[#f7fbfd]/80 text-sm'
                                      onChange={(event) =>
                                        updateWorldTableRow(entry, rowIndex, 'value', event.target.value)
                                      }
                                      onClick={(event) => event.stopPropagation()}
                                      value={row.value}
                                    />
                                  </td>
                                  <td className='p-2 align-top'>
                                    <button
                                      className='rounded-full px-2 py-1 text-xs text-[#8a2d2d] hover:bg-[#fff0f0]'
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        deleteWorldTableRow(entry, rowIndex);
                                      }}
                                      type='button'
                                    >
                                      删除
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <Button
                          className='mt-3 h-9 rounded-full bg-[#173f38] px-4 text-white hover:bg-[#22584f]'
                          onClick={(event) => {
                            event.stopPropagation();
                            addWorldTableRow(entry);
                          }}
                          type='button'
                        >
                          + 行
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {!selectedSection.entries.length ? (
                  <div className='grid min-h-40 place-items-center rounded-xl border border-dashed border-[#c9dfe6] bg-white/55 text-center'>
                    <div>
                      <h3 className='text-base font-semibold text-[#12342f]'>还没有世界观表格</h3>
                      <p className='mt-1 text-sm text-[#496761]'>点击 + 表格添加一个分类。</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
            <div className='rounded-2xl border border-[#d7e8ee] bg-[#f7fbfd]/70 p-3'>
              <div className='mb-3 flex items-center justify-between gap-3 px-2'>
                <h3 className='text-sm font-semibold text-[#496761]'>
                  {selectedSection.id === 'chapters' ? 'Chapter directory' : `${getSectionDisplayLabel(selectedSection)} entries`}
                </h3>
                <span className='text-xs text-[#6b8580]'>
                  {selectedSection.entries.length} {selectedSection.id === 'chapters' ? 'chapters' : 'entries'}
                </span>
              </div>
              <ScrollArea className='h-[420px] pr-3'>
                <div className='space-y-2'>
                  {selectedSection.entries.map((entry, index) => (
                    <button
                      key={entry.id}
                      className={
                        entry.id === selectedEntry?.id
                          ? 'grid w-full cursor-grab grid-cols-[3.5rem_1fr] gap-3 rounded-xl border border-[#b7d4cd] bg-[#dbe9df] p-3 text-left shadow-sm active:cursor-grabbing'
                          : 'grid w-full cursor-grab grid-cols-[3.5rem_1fr] gap-3 rounded-xl border border-transparent bg-white/70 p-3 text-left transition-colors hover:border-[#d7e8ee] hover:bg-white active:cursor-grabbing'
                      }
                      draggable
                      onClick={() => setSelectedEntryId(entry.id)}
                      onDragEnd={() => setDraggingEntryId(null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDragStart={(event) => handleEntryDragStart(event, entry.id)}
                      onDrop={(event) => handleEntryDrop(event, entry.id)}
                      style={{ opacity: draggingEntryId === entry.id ? 0.55 : 1 }}
                      type='button'
                    >
                      <span
                        className={
                          entry.id === selectedEntry?.id
                            ? 'flex h-10 items-center justify-center rounded-lg bg-[#173f38] text-sm font-semibold text-white'
                            : 'flex h-10 items-center justify-center rounded-lg bg-[#e8f1f4] text-sm font-semibold text-[#496761]'
                        }
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className='min-w-0'>
                        <span className='block truncate text-base font-semibold text-[#12342f]'>
                          {entry.title}
                        </span>
                        <span className='mt-1 block truncate text-sm text-[#496761]'>
                          {entry.summary || entry.eyebrow || 'No summary yet.'}
                        </span>
                      </span>
                    </button>
                  ))}
                  {!selectedSection.entries.length ? (
                    <div className='grid min-h-40 place-items-center rounded-xl border border-dashed border-[#c9dfe6] bg-white/55 text-center'>
                      <div>
                        <h3 className='text-base font-semibold text-[#12342f]'>No chapters yet</h3>
                        <p className='mt-1 text-sm text-[#496761]'>Use + Chapter to add the first one.</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {!isCharactersSection && !isWorldSection ? (
        <Card className='rounded-[1.5rem] border-white/70 bg-white/82 text-[#12342f] shadow-[0_18px_50px_rgba(32,86,120,0.12)] backdrop-blur'>
          <CardContent className='space-y-5 p-5 sm:p-6'>
            {selectedEntry ? (
              <>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div>
                    <p className='text-sm font-medium text-[#496761]'>Writing editor</p>
                    <h2 className='mt-1 text-2xl font-semibold'>{selectedEntry.title}</h2>
                  </div>
                  <Button
                    className='rounded-full border-[#d7a5a5] bg-white/70 text-[#8a2d2d] hover:bg-[#fff0f0]'
                    onClick={deleteEntry}
                    type='button'
                    variant='outline'
                  >
                    Delete Entry
                  </Button>
                </div>

              <div className='grid gap-3 md:grid-cols-[1fr_0.55fr]'>
                <Input
                  className='h-12 rounded-2xl border-[#d7e8ee] bg-[#f7fbfd] text-lg font-semibold'
                  onChange={(event) => updateEntry({ title: event.target.value })}
                  value={selectedEntry.title}
                />
                <Input
                  className='h-12 rounded-2xl border-[#d7e8ee] bg-[#f7fbfd]'
                  onChange={(event) => updateEntry({ eyebrow: event.target.value })}
                  value={selectedEntry.eyebrow ?? ''}
                />
              </div>

              <Textarea
                className='min-h-20 resize-none rounded-2xl border-[#d7e8ee] bg-[#f7fbfd]'
                onChange={(event) => updateEntry({ summary: event.target.value })}
                value={selectedEntry.summary}
              />

              <div className='grid gap-4 xl:grid-cols-[1fr_0.8fr]'>
                <div className='space-y-2'>
                  <div className='grid gap-2 md:grid-cols-[1fr_auto]'>
                    <Input
                      className='rounded-2xl border-[#d7e8ee] bg-[#f7fbfd]'
                      onChange={(event) => updateTags(event.target.value)}
                      value={(selectedEntry.tags ?? []).join(', ')}
                    />
                    <Button
                      className='rounded-full bg-[#173f38] text-white hover:bg-[#22584f]'
                      onClick={addTag}
                      type='button'
                    >
                      + Tag
                    </Button>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {(selectedEntry.tags ?? []).map((tag, index) => (
                      <Badge
                        key={`${tag}-${index}`}
                        className='gap-2 border-transparent bg-[#dbe9df] text-[#173f38]'
                      >
                        {tag}
                        <button
                          className='rounded-full px-1 text-[#173f38]/70 hover:bg-white/60 hover:text-[#173f38]'
                          onClick={() => deleteTag(index)}
                          type='button'
                        >
                          x
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className='space-y-3 rounded-2xl border border-[#d7e8ee] bg-[#f7fbfd] p-4'>
                  <div className='flex items-center justify-between gap-2'>
                    <h3 className='text-sm font-semibold'>Fields</h3>
                    <Button
                      className='h-8 rounded-full bg-[#173f38] px-3 text-white hover:bg-[#22584f]'
                      onClick={addField}
                      type='button'
                    >
                      + Field
                    </Button>
                  </div>
                  <ScrollArea className='max-h-52 pr-3'>
                    <div className='space-y-2'>
                      {(selectedEntry.fields ?? []).map((field, index) => (
                        <div
                          key={`${field.label}-${index}`}
                          className='grid gap-2 md:grid-cols-[0.55fr_1fr_auto]'
                        >
                          <Input
                            className='rounded-xl border-[#d7e8ee] bg-white/80'
                            onChange={(event) => updateField(index, 'label', event.target.value)}
                            value={field.label}
                          />
                          <Input
                            className='rounded-xl border-[#d7e8ee] bg-white/80'
                            onChange={(event) => updateField(index, 'value', event.target.value)}
                            value={field.value}
                          />
                          <Button
                            className='rounded-full border-[#d7a5a5] bg-white/70 text-[#8a2d2d] hover:bg-[#fff0f0]'
                            onClick={() => deleteField(index)}
                            type='button'
                            variant='outline'
                          >
                            Delete
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <Textarea
                className='min-h-[620px] resize-y rounded-2xl border-[#d7e8ee] bg-[#f7fbfd] text-base leading-8'
                onChange={(event) => updateEntry({ content: event.target.value })}
                value={selectedEntry.content}
              />
              </>
            ) : (
              <div className='grid min-h-[560px] place-items-center text-center'>
                <div>
                  <h2 className='text-xl font-semibold'>No entry selected</h2>
                  <p className='mt-2 text-sm text-[#496761]'>
                    Open the menu and add or choose a chapter, character, or note.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

