'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Clock, 
  MessageSquare,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  X
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  lang: string;
  reactions?: {
    thumbsUp: number;
    thumbsDown: number;
    heart: number;
    star: number;
  };
  isFavorite?: boolean;
  tags?: string[];
}

interface ChatHistoryProps {
  messages: ChatMessage[];
  onSearch: (query: string) => void;
  onFilter: (filters: ChatFilters) => void;
  onExport: (format: 'json' | 'csv' | 'txt') => void;
  onReact: (messageId: string, reaction: string) => void;
  onToggleFavorite: (messageId: string) => void;
  onTagMessage: (messageId: string, tag: string) => void;
  language: 'ne' | 'hi' | 'en';
}

interface ChatFilters {
  role: 'all' | 'user' | 'assistant';
  dateRange: {
    start: string;
    end: string;
  };
  tags: string[];
  favorites: boolean;
  searchQuery: string;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  onSearch,
  onFilter,
  onExport,
  onReact,
  onToggleFavorite,
  onTagMessage,
  language,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ChatFilters>({
    role: 'all',
    dateRange: { start: '', end: '' },
    tags: [],
    favorites: false,
    searchQuery: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const translations = {
    ne: {
      title: 'च्याट इतिहास',
      search: 'खोज्नुहोस्...',
      filters: 'फिल्टरहरू',
      export: 'निर्यात गर्नुहोस्',
      all: 'सबै',
      user: 'प्रयोगकर्ता',
      assistant: 'सहायक',
      favorites: 'मनपर्ने',
      dateRange: 'मिति दायरा',
      tags: 'ट्यागहरू',
      clearFilters: 'फिल्टर सफा गर्नुहोस्',
      selectAll: 'सबै छान्नुहोस्',
      deselectAll: 'सबै अचयन गर्नुहोस्',
      selected: 'छानिएका',
      noMessages: 'कुनै सन्देश फेला परेन',
      noResults: 'कुनै परिणाम फेला परेन',
      reactions: 'प्रतिक्रियाहरू',
      addTag: 'ट्याग थप्नुहोस्',
      removeTag: 'ट्याग हटाउनुहोस्',
      exportFormats: {
        json: 'JSON',
        csv: 'CSV',
        txt: 'Text',
      },
    },
    hi: {
      title: 'चैट इतिहास',
      search: 'खोजें...',
      filters: 'फिल्टर',
      export: 'निर्यात करें',
      all: 'सभी',
      user: 'उपयोगकर्ता',
      assistant: 'सहायक',
      favorites: 'पसंदीदा',
      dateRange: 'तिथि सीमा',
      tags: 'टैग',
      clearFilters: 'फिल्टर साफ करें',
      selectAll: 'सभी चुनें',
      deselectAll: 'सभी अचयन करें',
      selected: 'चुने गए',
      noMessages: 'कोई संदेश नहीं मिला',
      noResults: 'कोई परिणाम नहीं मिला',
      reactions: 'प्रतिक्रियाएं',
      addTag: 'टैग जोड़ें',
      removeTag: 'टैग हटाएं',
      exportFormats: {
        json: 'JSON',
        csv: 'CSV',
        txt: 'Text',
      },
    },
    en: {
      title: 'Chat History',
      search: 'Search...',
      filters: 'Filters',
      export: 'Export',
      all: 'All',
      user: 'User',
      assistant: 'Assistant',
      favorites: 'Favorites',
      dateRange: 'Date Range',
      tags: 'Tags',
      clearFilters: 'Clear Filters',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      selected: 'Selected',
      noMessages: 'No messages found',
      noResults: 'No results found',
      reactions: 'Reactions',
      addTag: 'Add Tag',
      removeTag: 'Remove Tag',
      exportFormats: {
        json: 'JSON',
        csv: 'CSV',
        txt: 'Text',
      },
    },
  };

  const t = translations[language];

  // Filter and search messages
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      // Role filter
      if (filters.role !== 'all' && message.role !== filters.role) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const messageDate = new Date(message.createdAt);
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

        if (startDate && messageDate < startDate) return false;
        if (endDate && messageDate > endDate) return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          message.tags?.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // Favorites filter
      if (filters.favorites && !message.isFavorite) {
        return false;
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const content = message.content.toLowerCase();
        if (!content.includes(query)) return false;
      }

      return true;
    });
  }, [messages, filters]);

  // Get unique tags from all messages
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    messages.forEach(message => {
      message.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [messages]);

  // Get date range for messages
  const dateRange = useMemo(() => {
    if (messages.length === 0) return { start: '', end: '' };
    
    const dates = messages.map(m => new Date(m.createdAt));
    const start = new Date(Math.min(...dates.map(d => d.getTime())));
    const end = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }, [messages]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev, searchQuery: query }));
    onSearch(query);
  };

  const handleFilterChange = (key: keyof ChatFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      role: 'all' as const,
      dateRange: { start: '', end: '' },
      tags: [],
      favorites: false,
      searchQuery: '',
    };
    setFilters(clearedFilters);
    setSearchQuery('');
    onFilter(clearedFilters);
  };

  const handleSelectMessage = (messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleSelectAll = () => {
    setSelectedMessages(filteredMessages.map(m => m.id));
  };

  const handleDeselectAll = () => {
    setSelectedMessages([]);
  };

  const handleExport = (format: 'json' | 'csv' | 'txt') => {
    const messagesToExport = selectedMessages.length > 0 
      ? messages.filter(m => selectedMessages.includes(m.id))
      : filteredMessages;
    
    onExport(format);
    setShowExportMenu(false);
  };

  const handleReaction = (messageId: string, reaction: string) => {
    onReact(messageId, reaction);
  };

  const handleToggleFavorite = (messageId: string) => {
    onToggleFavorite(messageId);
  };

  const handleAddTag = (messageId: string, tag: string) => {
    onTagMessage(messageId, tag);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(
      language === 'ne' ? 'ne-NP' : 
      language === 'hi' ? 'hi-IN' : 'en-US'
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(
      language === 'ne' ? 'ne-NP' : 
      language === 'hi' ? 'hi-IN' : 'en-US',
      { hour: '2-digit', minute: '2-digit' }
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t.title}</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t.filters}
          </Button>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="h-4 w-4 mr-2" />
              {t.export}
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <div className="p-2 space-y-1">
                  {Object.entries(t.exportFormats).map(([format, label]) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format as any)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{t.filters}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                {t.clearFilters}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Role Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t.role}</label>
              <div className="flex space-x-2">
                {['all', 'user', 'assistant'].map(role => (
                  <Button
                    key={role}
                    variant={filters.role === role ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('role', role)}
                  >
                    {t[role as keyof typeof t]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t.dateRange}</label>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">{t.tags}</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const newTags = filters.tags.includes(tag)
                          ? filters.tags.filter(t => t !== tag)
                          : [...filters.tags, tag];
                        handleFilterChange('tags', newTags);
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Favorites Filter */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="favorites"
                checked={filters.favorites}
                onChange={(e) => handleFilterChange('favorites', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="favorites" className="text-sm">
                {t.favorites}
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Controls */}
      {filteredMessages.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {t.selectAll}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
            >
              {t.deselectAll}
            </Button>
            {selectedMessages.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedMessages.length} {t.selected}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {messages.length === 0 ? t.noMessages : t.noResults}
          </div>
        ) : (
          filteredMessages.map(message => (
            <Card key={message.id} className="p-3">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={selectedMessages.includes(message.id)}
                  onChange={() => handleSelectMessage(message.id)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                        {message.role === 'user' ? t.user : t.assistant}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(message.createdAt)} {formatTime(message.createdAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(message.id)}
                      >
                        <Heart className={`h-4 w-4 ${message.isFavorite ? 'text-red-500 fill-current' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReaction(message.id, 'thumbsUp')}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        {message.reactions?.thumbsUp || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReaction(message.id, 'thumbsDown')}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        {message.reactions?.thumbsDown || 0}
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.tags && message.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {message.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
