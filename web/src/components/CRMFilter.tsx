import React from 'react';

interface CRMFilterProps {
  filterType: string;
  setFilterType: (val: string) => void;
  filterExactDate: string;
  setFilterExactDate: (val: string) => void;
  filterMonth: number;
  setFilterMonth: (val: number) => void;
  filterYear: number;
  setFilterYear: (val: number) => void;
  filterBranch: string;
  setFilterBranch: (val: string) => void;
  branches: any[];
}

export default function CRMFilter({
  filterType, setFilterType,
  filterExactDate, setFilterExactDate,
  filterMonth, setFilterMonth,
  filterYear, setFilterYear,
  filterBranch, setFilterBranch,
  branches
}: CRMFilterProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from(new Array(5), (val, index) => currentYear - index);
  
  const months = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
    { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
  ];

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <select 
        value={filterBranch} 
        onChange={(e) => setFilterBranch(e.target.value)}
        className="bg-glass-bg backdrop-blur-md border border-glass-border text-foreground text-sm rounded-xl px-4 py-2 outline-none focus:border-indigo-500"
      >
        <option value="">Semua Cabang</option>
        {branches.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      <select 
        value={filterType} 
        onChange={(e) => setFilterType(e.target.value)}
        className="bg-glass-bg backdrop-blur-md border border-glass-border text-foreground text-sm rounded-xl px-4 py-2 outline-none focus:border-indigo-500"
      >
        <option value="exact">Harian</option>
        <option value="month">Bulanan</option>
        <option value="year">Tahunan</option>
        <option value="all">Semua Waktu</option>
      </select>

      {filterType === 'exact' && (
        <input 
          type="date" 
          value={filterExactDate} 
          onChange={(e) => setFilterExactDate(e.target.value)}
          className="bg-glass-bg backdrop-blur-md border border-glass-border text-foreground text-sm rounded-xl px-4 py-2 outline-none focus:border-indigo-500 dark:[color-scheme:dark]" 
        />
      )}

      {(filterType === 'month') && (
        <select 
          value={filterMonth} 
          onChange={(e) => setFilterMonth(Number(e.target.value))}
          className="bg-glass-bg backdrop-blur-md border border-glass-border text-foreground text-sm rounded-xl px-4 py-2 outline-none focus:border-indigo-500"
        >
          {months.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      )}

      {(filterType === 'month' || filterType === 'year') && (
        <select 
          value={filterYear} 
          onChange={(e) => setFilterYear(Number(e.target.value))}
          className="bg-glass-bg backdrop-blur-md border border-glass-border text-foreground text-sm rounded-xl px-4 py-2 outline-none focus:border-indigo-500"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      )}
    </div>
  );
}
