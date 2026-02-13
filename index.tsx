
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, 
  Search, 
  Package as PackageIcon, 
  Download, 
  Settings, 
  Info, 
  ChevronRight, 
  X, 
  Globe, 
  Code,
  ShieldCheck,
  AlertCircle,
  LayoutGrid,
  Library,
  CheckCircle2,
  Trash2,
  ExternalLink
} from 'lucide-react';

// --- Types ---

interface Package {
  id: string;
  name: string;
  url: string;
  size?: string;
  minIOS?: string;
  maxIOS?: string;
  repoName: string;
  description?: string;
  version?: string;
}

interface Repository {
  id: string;
  name: string;
  url?: string;
  packages: Package[];
}

type Tab = 'featured' | 'sources' | 'installed' | 'search';

// --- Components ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('featured');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [installedIds, setInstalledIds] = useState<string[]>([]);
  const [installingIds, setInstallingIds] = useState<Record<string, number>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'url' | 'json'>('url');
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  // Load data on mount
  useEffect(() => {
    const savedRepos = localStorage.getItem('short-sileo-repos');
    const savedInstalled = localStorage.getItem('short-sileo-installed');
    
    if (savedRepos) {
      try { setRepos(JSON.parse(savedRepos)); } catch (e) { console.error(e); }
    } else {
      const defaultRepo: Repository = {
        id: 'default',
        name: 'ShortSileo Official',
        packages: [
          {
            id: 'pkg-1',
            name: 'Cylinder Reborn',
            url: 'https://github.com/ryannair05/Cylinder-Reborn',
            size: '1.2 MB',
            minIOS: '14.0',
            maxIOS: '17.0',
            repoName: 'ShortSileo Official',
            description: 'The classic icon animation tweak, updated for modern iOS.',
            version: '1.1.0'
          },
          {
            id: 'pkg-2',
            name: 'SnowBoard',
            url: 'https://sparkdev.me/',
            size: '2.5 MB',
            minIOS: '7.0',
            maxIOS: '18.0',
            repoName: 'ShortSileo Official',
            description: 'Powerful theme engine for iOS.',
            version: '1.5.21'
          }
        ]
      };
      setRepos([defaultRepo]);
    }

    if (savedInstalled) {
      try { 
        const parsed = JSON.parse(savedInstalled);
        if (Array.isArray(parsed)) setInstalledIds(parsed);
      } catch (e) { console.error(e); }
    }
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem('short-sileo-repos', JSON.stringify(repos));
  }, [repos]);

  useEffect(() => {
    localStorage.setItem('short-sileo-installed', JSON.stringify(installedIds));
  }, [installedIds]);

  const allPackages = useMemo(() => {
    return repos.flatMap(repo => repo.packages);
  }, [repos]);

  const installedPackages = useMemo(() => {
    return allPackages.filter(p => installedIds.includes(p.id));
  }, [allPackages, installedIds]);

  const filteredPackages = useMemo(() => {
    const source = activeTab === 'installed' ? installedPackages : allPackages;
    if (!searchQuery) return source;
    const q = searchQuery.toLowerCase();
    return source.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.repoName.toLowerCase().includes(q)
    );
  }, [allPackages, installedPackages, searchQuery, activeTab]);

  const handleInstall = (pkg: Package) => {
    if (installedIds.includes(pkg.id) || installingIds[pkg.id] !== undefined) return;

    // Requirement: Open the URL when starting install
    if (pkg.url && pkg.url !== '#') {
      try {
        window.open(pkg.url, '_blank');
      } catch (e) {
        console.error("Popup blocked?", e);
      }
    }

    // Simulate download progress
    let progress = 0;
    setInstallingIds(prev => ({ ...prev, [pkg.id]: 0 }));
    
    const interval = setInterval(() => {
      progress += Math.random() * 40;
      if (progress >= 100) {
        clearInterval(interval);
        setInstallingIds(prev => {
          const next = { ...prev };
          delete next[pkg.id];
          return next;
        });
        setInstalledIds(prev => {
          if (prev.includes(pkg.id)) return prev;
          return [...prev, pkg.id];
        });
      } else {
        setInstallingIds(prev => ({ ...prev, [pkg.id]: Math.floor(progress) }));
      }
    }, 300);
  };

  const handleUninstall = (pkgId: string) => {
    // Immediate state update for responsiveness
    setInstalledIds(prev => prev.filter(id => id !== pkgId));
  };

  const handleOpen = (pkg: Package) => {
    if (pkg.url && pkg.url !== '#') {
      window.open(pkg.url, '_blank');
    }
  };

  const handleAddSource = async () => {
    try {
      let newRepoData: any;
      if (addMode === 'url') {
        const response = await fetch(inputValue);
        newRepoData = await response.json();
      } else {
        newRepoData = JSON.parse(inputValue);
      }

      const repoName = newRepoData.Name || newRepoData.name || 'Untitled Repository';
      let rawPackages = newRepoData.Packages || newRepoData.packages || [];
      const processedPackages: Package[] = [];
      
      if (Array.isArray(rawPackages)) {
        rawPackages.forEach((p: any, index: number) => {
          processedPackages.push({
            id: `pkg-${Date.now()}-${index}`,
            name: p.name || p.Name || 'Unknown Package',
            url: p.url || p.URL || '#',
            size: p.size || p.Size || 'Unknown',
            minIOS: p.minIOS || p.min_ios || '0.0',
            maxIOS: p.maxIOS || p.max_ios || '99.0',
            repoName: repoName,
            description: p.description || 'No description provided.',
            version: p.version || '1.0.0'
          });
        });
      } else if (typeof rawPackages === 'object') {
        Object.entries(rawPackages).forEach(([name, data]: [string, any], index) => {
          processedPackages.push({
            id: `pkg-${Date.now()}-${index}`,
            name: name,
            url: data.url || data.URL || '#',
            size: data.size || data.Size || 'Unknown',
            minIOS: data.minIOS || data.min_ios || '0.0',
            maxIOS: data.maxIOS || data.max_ios || '99.0',
            repoName: repoName,
            description: data.description || 'No description provided.',
            version: data.version || '1.0.0'
          });
        });
      }

      const newRepo: Repository = {
        id: Date.now().toString(),
        name: repoName,
        url: addMode === 'url' ? inputValue : undefined,
        packages: processedPackages
      };

      setRepos([...repos, newRepo]);
      setInputValue('');
      setIsAddModalOpen(false);
    } catch (error) {
      alert('Error adding repository: ' + error);
    }
  };

  const removeRepo = (id: string) => {
    if (confirm('Are you sure you want to remove this repository?')) {
      setRepos(repos.filter(r => r.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] text-black dark:text-white font-sans transition-colors duration-300 pb-24 selection:bg-blue-500 selection:text-white">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex justify-between items-end">
          <h1 className="text-3xl font-bold tracking-tight">
            {activeTab === 'featured' && 'Featured'}
            {activeTab === 'sources' && 'Sources'}
            {activeTab === 'installed' && 'Installed'}
            {activeTab === 'search' && 'Search'}
          </h1>
          {activeTab === 'sources' && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
        {activeTab === 'search' && (
          <div className="max-w-2xl mx-auto mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Packages, Developers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-900 rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {activeTab === 'featured' && (
          <div className="space-y-8">
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">New Packages</h2>
                <button className="text-blue-500 text-sm font-medium">See All</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {allPackages.map(pkg => (
                  <PackageCard 
                    key={pkg.id} 
                    pkg={pkg} 
                    onClick={() => setSelectedPackage(pkg)} 
                    onInstall={() => handleInstall(pkg)}
                    onUninstall={() => handleUninstall(pkg.id)}
                    onOpen={() => handleOpen(pkg)}
                    status={installingIds[pkg.id] !== undefined ? 'installing' : installedIds.includes(pkg.id) ? 'installed' : 'none'}
                    progress={installingIds[pkg.id]}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-zinc-800 shadow-sm border border-gray-200 dark:border-zinc-800">
              {repos.map(repo => (
                <div key={repo.id} className="p-4 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                      <Library size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{repo.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate max-w-[200px]">
                        {repo.url || 'Local Source'} • {repo.packages.length} Packages
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeRepo(repo.id); }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'installed' && (
          <div className="space-y-4">
            {installedPackages.length === 0 ? (
              <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                <PackageIcon size={48} className="mb-4 opacity-20" />
                <p>No packages installed.</p>
              </div>
            ) : (
              installedPackages.map(pkg => (
                <PackageCard 
                  key={pkg.id} 
                  pkg={pkg} 
                  onClick={() => setSelectedPackage(pkg)} 
                  onInstall={() => {}}
                  onUninstall={() => handleUninstall(pkg.id)}
                  onOpen={() => handleOpen(pkg)}
                  status="installed"
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            {filteredPackages.map(pkg => (
              <PackageCard 
                key={pkg.id} 
                pkg={pkg} 
                onClick={() => setSelectedPackage(pkg)} 
                onInstall={() => handleInstall(pkg)}
                onUninstall={() => handleUninstall(pkg.id)}
                onOpen={() => handleOpen(pkg)}
                status={installingIds[pkg.id] !== undefined ? 'installing' : installedIds.includes(pkg.id) ? 'installed' : 'none'}
                progress={installingIds[pkg.id]}
              />
            ))}
          </div>
        )}
      </main>

      {/* Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 pb-safe z-40">
        <div className="max-w-2xl mx-auto grid grid-cols-4 py-2">
          <button 
            onClick={() => setActiveTab('featured')}
            className={`flex flex-col items-center space-y-1 transition-colors ${activeTab === 'featured' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <LayoutGrid size={24} />
            <span className="text-[10px] font-medium">Featured</span>
          </button>
          <button 
            onClick={() => setActiveTab('sources')}
            className={`flex flex-col items-center space-y-1 transition-colors ${activeTab === 'sources' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <Library size={24} />
            <span className="text-[10px] font-medium">Sources</span>
          </button>
          <button 
            onClick={() => setActiveTab('installed')}
            className={`flex flex-col items-center space-y-1 transition-colors ${activeTab === 'installed' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <CheckCircle2 size={24} />
            <span className="text-[10px] font-medium">Installed</span>
          </button>
          <button 
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center space-y-1 transition-colors ${activeTab === 'search' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <Search size={24} />
            <span className="text-[10px] font-medium">Search</span>
          </button>
        </div>
      </nav>

      {/* Add Source Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add Source</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl mb-6">
              <button 
                onClick={() => setAddMode('url')}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${addMode === 'url' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-gray-500'}`}
              >
                URL
              </button>
              <button 
                onClick={() => setAddMode('json')}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${addMode === 'json' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-gray-500'}`}
              >
                JSON
              </button>
            </div>

            <div className="space-y-4">
              {addMode === 'url' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase px-1">Repository URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="url" 
                      placeholder="https://example.com/repo.json"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-zinc-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase px-1">Raw JSON Data</label>
                  <div className="relative">
                    <Code className="absolute left-3 top-4 text-gray-400" size={18} />
                    <textarea 
                      placeholder='{ "Name": "My Repo", "Packages": [...] }'
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      rows={5}
                      className="w-full bg-gray-100 dark:bg-zinc-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleAddSource}
              className="w-full mt-8 bg-blue-500 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-colors shadow-lg active:scale-[0.98]"
            >
              Add Source
            </button>
          </div>
        </div>
      )}

      {/* Package Detail Sheet */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl mx-auto rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-zinc-800 p-4 flex justify-between items-center z-10">
              <div className="w-10" />
              <div className="h-1.5 w-12 bg-gray-300 dark:bg-zinc-700 rounded-full" />
              <button 
                onClick={() => setSelectedPackage(null)}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8">
              <div className="flex items-start space-x-6 mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[22%] shadow-xl flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
                  {selectedPackage.name.charAt(0)}
                </div>
                <div className="flex-1 space-y-1">
                  <h2 className="text-3xl font-extrabold leading-tight">{selectedPackage.name}</h2>
                  <p className="text-blue-500 font-medium">{selectedPackage.repoName}</p>
                  <p className="text-gray-500 text-sm">Version {selectedPackage.version}</p>
                  
                  <div className="flex space-x-2 pt-3">
                    {installedIds.includes(selectedPackage.id) ? (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleOpen(selectedPackage)}
                          className="bg-blue-500 text-white px-6 py-1.5 rounded-full font-bold text-sm hover:bg-blue-600 shadow-md flex items-center"
                        >
                          <ExternalLink size={16} className="mr-2" /> OPEN
                        </button>
                        <button 
                          onClick={() => handleUninstall(selectedPackage.id)}
                          className="bg-red-500 text-white px-6 py-1.5 rounded-full font-bold text-sm hover:bg-red-600 shadow-md flex items-center"
                        >
                          <Trash2 size={16} className="mr-2" /> UNINSTALL
                        </button>
                      </div>
                    ) : installingIds[selectedPackage.id] !== undefined ? (
                      <div className="bg-gray-100 dark:bg-zinc-800 px-6 py-1.5 rounded-full font-bold text-sm text-blue-500">
                        INSTALLING {installingIds[selectedPackage.id]}%
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleInstall(selectedPackage)}
                        className="bg-blue-500 text-white px-6 py-1.5 rounded-full font-bold text-sm hover:bg-blue-600 shadow-md"
                      >
                        GET
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center text-blue-500 mb-1">
                    <ShieldCheck size={16} className="mr-1.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Compatibility</span>
                  </div>
                  <p className="text-sm font-semibold">iOS {selectedPackage.minIOS} - {selectedPackage.maxIOS}</p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center text-indigo-500 mb-1">
                    <LayoutGrid size={16} className="mr-1.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">File Size</span>
                  </div>
                  <p className="text-sm font-semibold">{selectedPackage.size}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold">Description</h3>
                <p className="text-gray-600 dark:text-zinc-400 leading-relaxed text-lg">
                  {selectedPackage.description}
                </p>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-100 dark:border-zinc-800 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Developer</span>
                  <span className="font-semibold">ShortSileo Team</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Bundle ID</span>
                  <span className="font-mono text-xs opacity-70 truncate max-w-[200px]">com.shortsileo.{selectedPackage.name.toLowerCase().replace(/\s+/g, '')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface PackageCardProps {
  pkg: Package;
  onClick: () => void;
  onInstall: () => void;
  onUninstall: () => void;
  onOpen: () => void;
  status: 'none' | 'installing' | 'installed';
  progress?: number;
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg, onClick, onInstall, onUninstall, onOpen, status, progress }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-zinc-900 p-4 rounded-2xl flex items-center space-x-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden relative"
    >
      {status === 'installing' && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      )}
      
      <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-[22%] flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-sm">
        {pkg.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-lg leading-tight truncate">{pkg.name}</h3>
        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{pkg.repoName}</p>
        <div className="flex items-center mt-1 space-x-2">
          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
            v{pkg.version}
          </span>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
            {pkg.size}
          </span>
        </div>
      </div>
      
      <div className="flex-shrink-0 flex items-center space-x-1">
        {status === 'installed' ? (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); onOpen(); }}
              className="bg-gray-100 dark:bg-zinc-800 text-blue-500 px-4 py-1.5 rounded-full font-extrabold text-xs hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            >
              OPEN
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onUninstall(); }}
              className="p-2.5 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Uninstall"
            >
              <Trash2 size={20} />
            </button>
          </>
        ) : status === 'installing' ? (
          <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-500 px-3 py-1.5 rounded-full font-extrabold text-[10px]">
            {progress}%
          </div>
        ) : (
          <button 
            onClick={(e) => { e.stopPropagation(); onInstall(); }}
            className="bg-blue-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full font-extrabold text-xs active:bg-blue-500 active:text-white transition-colors hover:bg-blue-200 dark:hover:bg-zinc-700"
          >
            GET
          </button>
        )}
      </div>
    </div>
  );
};

// --- Initial Render ---

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
