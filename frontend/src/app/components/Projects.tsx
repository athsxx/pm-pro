import React, { useState, useMemo } from 'react';
import { Button, Input, Card, Badge, ProgressBar, Avatar, AvatarGroup, cn } from './ui';
import { Search, Filter, MoreHorizontal, Plus, Grid3X3, List, ChevronUp, ChevronDown } from 'lucide-react';
import { mockProjects, teamMembers } from '../data';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

type ViewMode = 'table' | 'grid';
type SortKey = 'name' | 'status' | 'progress' | 'endDate';

export function ProjectsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('table');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filtered = useMemo(() => {
    let list = mockProjects.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.manager.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter !== 'All') list = list.filter(p => p.status === statusFilter);
    list = [...list].sort((a, b) => {
      let va: any = a[sortKey === 'endDate' ? 'endDate' : sortKey];
      let vb: any = b[sortKey === 'endDate' ? 'endDate' : sortKey];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return list;
  }, [search, statusFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const statusColors: Record<string, string> = { Active: 'success', 'On Hold': 'warning', Completed: 'neutral' };
  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col
      ? sortAsc ? <ChevronUp size={13} /> : <ChevronDown size={13} />
      : <span className="w-3 h-3" />;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''} · {mockProjects.filter(p => p.status === 'Active').length} active
          </p>
        </div>
        <Button size="sm" className="gap-1.5 shadow-sm">
          <Plus size={14} /> New Project
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <Input
            className="pl-9 h-9"
            placeholder="Search projects or managers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
          {['All', 'Active', 'On Hold', 'Completed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-semibold transition-all',
                statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView('table')}
            className={cn('p-1.5 rounded-md transition-all', view === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600')}
          >
            <List size={15} />
          </button>
          <button
            onClick={() => setView('grid')}
            className={cn('p-1.5 rounded-md transition-all', view === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600')}
          >
            <Grid3X3 size={15} />
          </button>
        </div>
      </div>

      {/* Table View */}
      {view === 'table' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <SortableHeader label="Project Name" col="name" current={sortKey} asc={sortAsc} onClick={() => toggleSort('name')} />
                  <SortableHeader label="Status" col="status" current={sortKey} asc={sortAsc} onClick={() => toggleSort('status')} />
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Team</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Dates</th>
                  <SortableHeader label="Progress" col="progress" current={sortKey} asc={sortAsc} onClick={() => toggleSort('progress')} />
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Manager</th>
                  <th className="px-5 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((project, i) => (
                  <motion.tr
                    key={project.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                          style={{ backgroundColor: project.color }}
                        >
                          {project.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-[#00BFA5] transition-colors">
                            {project.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[180px]">{project.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={(statusColors[project.status] || 'neutral') as any} dot>
                        {project.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <AvatarGroup
                        avatars={project.teamIds.map(id => {
                          const m = teamMembers.find(t => t.id === id);
                          return { src: m?.avatar, alt: m?.name };
                        })}
                        max={3}
                        size="xs"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-medium text-gray-600">{project.startDate}</p>
                      <p className="text-xs text-gray-400">→ {project.endDate}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 w-36">
                        <ProgressBar value={project.progress} className="flex-1" />
                        <span className="text-xs font-bold text-gray-600 w-8 text-right">{project.progress}%</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{project.tasksDone}/{project.tasksTotal} tasks</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar src={project.avatar} alt={project.manager} size="xs" />
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[90px]">{project.manager}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        className="p-1.5 text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-14 text-center text-gray-400">
                <p className="font-semibold text-sm">No projects match your filters</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project, i) => (
            <motion.div key={project.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card
                className="p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.name.substring(0, 2).toUpperCase()}
                  </div>
                  <Badge variant={(statusColors[project.status] || 'neutral') as any} dot>{project.status}</Badge>
                </div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#00BFA5] transition-colors">{project.name}</h3>
                <p className="text-xs text-gray-400 mb-4 line-clamp-2">{project.description}</p>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">{project.tasksDone}/{project.tasksTotal} tasks</span>
                  <span className="text-xs font-bold text-gray-700">{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} />
                <div className="mt-3 flex items-center justify-between">
                  <AvatarGroup
                    avatars={project.teamIds.map(id => {
                      const m = teamMembers.find(t => t.id === id);
                      return { src: m?.avatar, alt: m?.name };
                    })}
                    max={3}
                    size="xs"
                  />
                  <span className="text-xs text-gray-400">Due {project.endDate}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function SortableHeader({ label, col, current, asc, onClick }: {
  label: string; col: string; current: string; asc: boolean; onClick: () => void;
}) {
  const active = current === col;
  return (
    <th
      className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-600 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-1">
        {label}
        {active ? (
          asc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <span className="w-3" />
        )}
      </div>
    </th>
  );
}
