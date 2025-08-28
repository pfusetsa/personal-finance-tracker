import React, { useState, useEffect } from 'react';
import FilterPopover from './FilterPopover';
import DatePicker from './DatePicker';
import FilterIcon from './icons/FilterIcon';
import FilterIconFilled from './icons/FilterIconFilled'; 

// --- Sub-component for Multi-Select Checklists (Categories & Accounts) ---
function MultiSelectFilter({ options, selectedIds, onApply, t }) {
  const [selected, setSelected] = useState(new Set(selectedIds));
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    onApply(Array.from(selected));
  }, [selected]);

  const handleSelect = (id) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder={t.search}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-1 border rounded text-sm"
      />
      <div className="max-h-48 overflow-y-auto pr-2">
        {filteredOptions.map(option => (
          <label key={option.id} className="flex items-center space-x-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={selected.has(option.id)}
              onChange={() => handleSelect(option.id)}
            />
            <span>{option.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// --- Main Component for the entire Table Header ---
function TransactionFilters({ filters, onFilterChange, accounts, categories, t, language }) {
  const [openFilter, setOpenFilter] = useState(null);
  const [localFilters, setLocalFilters] = useState(filters);

  const isFilterActive = (key) => {
    switch(key) {
      case 'dateRange': return !!filters.dateRange.start || !!filters.dateRange.end;
      case 'description': return filters.description.length > 0;
      case 'categoryIds': return filters.categoryIds.length > 0;
      case 'accountIds': return filters.accountIds.length > 0;
      case 'recurrent': return filters.recurrent !== null;
      case 'amountRange': return !!filters.amountRange.min || !!filters.amountRange.max;
      default: return false;
    }
  };

  useEffect(() => { setLocalFilters(filters); }, [filters]);

  const handleApply = () => { onFilterChange(localFilters); setOpenFilter(null); };

  const handleClear = (filterKey) => {
    let clearedValue;
    switch(filterKey) {
        case 'accountIds':
        case 'categoryIds':
            clearedValue = []; break;
        case 'dateRange':
            clearedValue = { start: '', end: '' }; break;
        case 'description':
            clearedValue = ''; break;
        case 'recurrent':
            clearedValue = null; break;
        case 'amountRange':
            clearedValue = { min: '', max: '' }; break;
        case 'sort':
            clearedValue = { by: 'date', order: 'desc' }; break;
        default:
            clearedValue = null;
    }
    onFilterChange({ [filterKey]: clearedValue });
    setOpenFilter(null);
  };
  
  const renderFilterPopover = (key, title, content) => (
    <FilterPopover 
      title={title} 
      onApply={handleApply} 
      onClear={() => handleClear(key)}
      onClose={() => setOpenFilter(null)}
      t={t}
    >
      {content}
    </FilterPopover>
  );
  
  const thClassName = "relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
  const handleToggle = (key) => setOpenFilter(openFilter === key ? null : key);

  return (
    <thead className="bg-gray-50">
      <tr>
        <th className={thClassName}>
          <div className="flex items-center cursor-pointer" onClick={() => handleToggle('date')}>
            {t.date}
            {isFilterActive('dateRange') || isFilterActive('sort') ? <FilterIconFilled /> : <FilterIcon />}
          </div>
          {openFilter === 'date' && renderFilterPopover('dateRange', t.date, (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.sort}</label>
              <select 
                className="w-full p-1 border rounded text-sm"
                value={`${localFilters.sort.by}-${localFilters.sort.order}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-');
                  setLocalFilters(f => ({ ...f, sort: { by, order } }));
                }}
              >
                <option value="date-desc">{t.newestToOldest}</option><option value="date-asc">{t.oldestToNewest}</option>
              </select>
              <label className="text-sm font-medium pt-2 block">{t.filterByDateRange}</label>
              <DatePicker placeholderText={t.datePickerFromPlaceholder} selectedDate={localFilters.dateRange.start} onChange={date => setLocalFilters(f => ({...f, dateRange: {...f.dateRange, start: date.toISOString().split('T')[0]}}))} language={language} />
              <DatePicker placeholderText={t.datePickerToPlaceholder} selectedDate={localFilters.dateRange.end} onChange={date => setLocalFilters(f => ({...f, dateRange: {...f.dateRange, end: date.toISOString().split('T')[0]}}))} language={language} />
            </div>
          ))}
        </th>
        <th className={thClassName}>
          <div className="flex items-center cursor-pointer" onClick={() => handleToggle('description')}>
            {t.description}
            {isFilterActive('description') ? <FilterIconFilled /> : <FilterIcon />}
          </div>
            {openFilter === 'description' && renderFilterPopover('description', t.description,
              <input type="text" value={localFilters.description} onChange={e => setLocalFilters(f => ({...f, description: e.target.value}))} className="w-full p-1 border rounded text-sm" placeholder={t.search} />
            )}
        </th>
        <th className={thClassName}>
            <div className="flex items-center cursor-pointer" onClick={() => handleToggle('category')}>
              {t.category}
              {isFilterActive('categoryIds') ? <FilterIconFilled /> : <FilterIcon />}
            </div>
            {openFilter === 'category' && renderFilterPopover('categoryIds', t.category, 
                <MultiSelectFilter options={categories} selectedIds={localFilters.categoryIds} onApply={(ids) => setLocalFilters(f => ({...f, categoryIds: ids}))} t={t}/>
            )}
        </th>
        <th className={thClassName}>
            <div className="flex items-center cursor-pointer" onClick={() => handleToggle('account')}>
              {t.account}
              {isFilterActive('accountIds') ? <FilterIconFilled /> : <FilterIcon />}
            </div>
            {openFilter === 'account' && renderFilterPopover('accountIds', t.account, 
                <MultiSelectFilter options={accounts} selectedIds={localFilters.accountIds} onApply={(ids) => setLocalFilters(f => ({...f, accountIds: ids}))} t={t}/>
            )}
        </th>
        <th className={thClassName}>
            <div className="flex items-center cursor-pointer" onClick={() => handleToggle('recurrent')}>
              {t.recurrent}
              {isFilterActive('recurrent') ? <FilterIconFilled /> : <FilterIcon />}
            </div>
            {openFilter === 'recurrent' && renderFilterPopover('recurrent', t.recurrent, (
                <div className="space-y-1">
                    <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={localFilters.recurrent === true} onChange={() => setLocalFilters(f => ({...f, recurrent: f.recurrent === true ? null : true}))} /> <span>{t.yes}</span></label>
                    <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={localFilters.recurrent === false} onChange={() => setLocalFilters(f => ({...f, recurrent: f.recurrent === false ? null : false}))} /> <span>{t.no}</span></label>
                </div>
            ))}
        </th>
        <th className={`${thClassName}`}>
            <div className="flex items-center justify-end cursor-pointer" onClick={() => handleToggle('amount')}>
              {t.amount}
              {isFilterActive('amountRange') ? <FilterIconFilled /> : <FilterIcon />}
            </div>
            {openFilter === 'amount' && renderFilterPopover('amountRange', t.amount, (
                <div className="space-y-2">
                    <input type="number" value={localFilters.amountRange.min} onChange={e => setLocalFilters(f => ({...f, amountRange: {...f.amountRange, min: e.target.value}}))} placeholder={t.minAmount} className="w-full p-1 border rounded text-sm" />
                    <input type="number" value={localFilters.amountRange.max} onChange={e => setLocalFilters(f => ({...f, amountRange: {...f.amountRange, max: e.target.value}}))} placeholder={t.maxAmount} className="w-full p-1 border rounded text-sm" />
                </div>
            ))}
        </th>
        <th className={`${thClassName} text-right`}>{t.actions}</th>
      </tr>
    </thead>
  );
}

export default TransactionFilters;