import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Calculator, Check, Copy, Edit2, HelpCircle, Menu, Plus, Trash2, Wheat, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePersonas } from '@/hooks/use-personas';
import { DOC_PAGES } from '@/lib/docs';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** The fold-out menu: manage starters and open the docs. */
export function AppMenu() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { personas, activePersonaId, setActivePersonaId, addPersona, deletePersona, renamePersona, duplicatePersona } = usePersonas();
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const goToCalculator = () => {
    setOpen(false);
    if (pathname !== '/') navigate('/');
  };

  const selectStarter = (id: string) => {
    setActivePersonaId(id);
    goToCalculator();
  };

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const confirmRename = () => {
    if (renamingId && renameValue.trim()) renamePersona(renamingId, renameValue.trim());
    setRenamingId(null);
  };

  const navLink = (to: string, label: string, Icon: typeof BookOpen) => (
    <Link
      key={to}
      to={to}
      onClick={() => setOpen(false)}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted',
        pathname === to && 'bg-muted font-medium',
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </Link>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('menu')}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 max-w-[90vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">{t('title')}</SheetTitle>
          <SheetDescription className="sr-only">{t('menu')}</SheetDescription>
        </SheetHeader>

        <nav className="mt-6 space-y-6">
          <div className="space-y-1">
            {navLink('/', t('calculator'), Calculator)}
            {navLink('/guidance', t('viewGuidance'), HelpCircle)}
          </div>

          <section className="space-y-2">
            <h2 className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('starters')}</h2>
            <ul className="space-y-1">
              {personas.map(p => (
                <li key={p.id} className={cn('rounded-md', p.id === activePersonaId && 'bg-primary/10')}>
                  {renamingId === p.id ? (
                    <div className="flex items-center gap-1 p-1">
                      <Input
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') confirmRename();
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        className="h-8"
                        aria-label={t('renameStarter')}
                        autoFocus
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={confirmRename} aria-label={t('save')}><Check className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRenamingId(null)} aria-label={t('cancel')}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : confirmDeleteId === p.id ? (
                    <div className="flex items-center gap-1 p-1 text-sm">
                      <span className="flex-1 px-1">{t('deleteStarterConfirm')} “{p.name}”?</span>
                      <Button variant="destructive" size="sm" className="h-8" onClick={() => { deletePersona(p.id); setConfirmDeleteId(null); }}>{t('delete')}</Button>
                      <Button variant="ghost" size="sm" className="h-8" onClick={() => setConfirmDeleteId(null)}>{t('cancel')}</Button>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => selectStarter(p.id)}
                        className="flex flex-1 items-center gap-2 truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                        aria-current={p.id === activePersonaId}
                      >
                        <Wheat className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{p.name}</span>
                      </button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startRename(p.id, p.name)} aria-label={`${t('renameStarter')}: ${p.name}`}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicatePersona(p.id, `${p.name} (${t('copySuffix')})`)} aria-label={`${t('duplicateStarter')}: ${p.name}`}><Copy className="h-3.5 w-3.5" /></Button>
                      {personas.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setConfirmDeleteId(p.id)} aria-label={`${t('delete')}: ${p.name}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="w-full" onClick={() => addPersona(`Starter ${personas.length + 1}`)}>
              <Plus className="h-4 w-4 mr-1" />
              {t('addStarter')}
            </Button>
          </section>

          <section className="space-y-1">
            <h2 className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('documentation')}</h2>
            {DOC_PAGES.map(d => navLink(`/docs/${d.slug}`.replace(/\/$/, ''), d.title, BookOpen))}
          </section>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
