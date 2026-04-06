'use client';

import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'VIEWER' | 'ANALYST' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
}

interface Summary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  totalRecords: number;
}

interface Record {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  notes: string | null;
  createdBy?: { name: string };
}

interface Category {
  category: string;
  income: number;
  expenses: number;
  net: number;
}

interface RecordFormData {
  amount: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  notes: string;
}

type TabType = 'summary' | 'records' | 'categories' | 'recent';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const initialFormData: RecordFormData = {
  amount: '',
  type: 'EXPENSE',
  category: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
};

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [summary, setSummary] = useState<Summary | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentRecords, setRecentRecords] = useState<Record[]>([]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState<RecordFormData>(initialFormData);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<RecordFormData>(initialFormData);
  const [crudLoading, setCrudLoading] = useState(false);
  const [crudMessage, setCrudMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (crudMessage) {
      const timer = setTimeout(() => setCrudMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [crudMessage]);

  const apiFetch = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const { user: userData, token: authToken } = response.data;
      setUser(userData);
      setToken(authToken);
      setIsLoggedIn(true);
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setToken(null);
    setSummary(null);
    setRecords([]);
    setCategories([]);
    setRecentRecords([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const fetchSummary = useCallback(async () => {
    if (!token || !user || user.role === 'VIEWER') return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/dashboard/summary');
      setSummary(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  }, [token, user, apiFetch]);

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/records?limit=50');
      setRecords(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  }, [token, apiFetch]);

  const fetchCategories = useCallback(async () => {
    if (!token || !user || user.role === 'VIEWER') return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/dashboard/categories');
      setCategories(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [token, user, apiFetch]);

  const fetchRecentRecords = useCallback(async () => {
    if (!token || !user || user.role === 'VIEWER') return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/dashboard/recent?limit=10');
      setRecentRecords(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent records');
    } finally {
      setLoading(false);
    }
  }, [token, user, apiFetch]);

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    setError(null);
    
    if (activeTab === 'summary') fetchSummary();
    else if (activeTab === 'records') fetchRecords();
    else if (activeTab === 'categories') fetchCategories();
    else if (activeTab === 'recent') fetchRecentRecords();
  }, [activeTab, isLoggedIn, token, fetchSummary, fetchRecords, fetchCategories, fetchRecentRecords]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateForInput = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const isAdmin = user?.role === 'ADMIN';

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setCrudLoading(true);
    setCrudMessage(null);

    try {
      await apiFetch('/api/records', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(createFormData.amount),
          type: createFormData.type,
          category: createFormData.category,
          date: createFormData.date,
          notes: createFormData.notes || undefined,
        }),
      });

      setCrudMessage({ type: 'success', text: 'Record created successfully!' });
      setShowCreateForm(false);
      setCreateFormData(initialFormData);
      await fetchRecords();
    } catch (err) {
      setCrudMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create record' });
    } finally {
      setCrudLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!isAdmin || !confirm('Are you sure you want to delete this record?')) return;

    setCrudLoading(true);
    setCrudMessage(null);

    try {
      await apiFetch(`/api/records/${recordId}`, { method: 'DELETE' });
      setCrudMessage({ type: 'success', text: 'Record deleted successfully!' });
      await fetchRecords();
    } catch (err) {
      setCrudMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete record' });
    } finally {
      setCrudLoading(false);
    }
  };

  const startEditRecord = (record: Record) => {
    setEditingRecordId(record.id);
    setEditFormData({
      amount: record.amount.toString(),
      type: record.type,
      category: record.category,
      date: formatDateForInput(record.date),
      notes: record.notes || '',
    });
  };

  const cancelEdit = () => {
    setEditingRecordId(null);
    setEditFormData(initialFormData);
  };

  const handleUpdateRecord = async (e: React.FormEvent, originalRecord: Record) => {
    e.preventDefault();
    if (!isAdmin || !editingRecordId) return;

    setCrudLoading(true);
    setCrudMessage(null);

    const payload: Partial<{ amount: number; type: 'INCOME' | 'EXPENSE'; category: string; date: string; notes: string | null }> = {};

    const newAmount = parseFloat(editFormData.amount);
    if (newAmount !== originalRecord.amount) payload.amount = newAmount;
    if (editFormData.type !== originalRecord.type) payload.type = editFormData.type;
    if (editFormData.category !== originalRecord.category) payload.category = editFormData.category;
    if (editFormData.date !== formatDateForInput(originalRecord.date)) payload.date = editFormData.date;
    if (editFormData.notes !== (originalRecord.notes || '')) payload.notes = editFormData.notes || null;

    if (Object.keys(payload).length === 0) {
      cancelEdit();
      setCrudLoading(false);
      return;
    }

    try {
      await apiFetch(`/api/records/${editingRecordId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setCrudMessage({ type: 'success', text: 'Record updated successfully!' });
      cancelEdit();
      await fetchRecords();
    } catch (err) {
      setCrudMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update record' });
    } finally {
      setCrudLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Finance Dashboard</h2>
            <p className="mt-2 text-center text-sm text-gray-600">Sign in to access the dashboard</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Test Accounts</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">Admin:</span> admin@example.com / Password123</p>
              <p><span className="font-medium">Analyst:</span> analyst@example.com / Password123</p>
              <p><span className="font-medium">Viewer:</span> viewer@example.com / Password123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-600">Logged in as </span>
              <span className="font-medium text-gray-900">{user?.name}</span>
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user?.role === 'ADMIN' ? 'bg-red-100 text-red-800' : user?.role === 'ANALYST' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {crudMessage && (
          <div className={`mb-4 rounded-md p-4 ${crudMessage.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className={`text-sm ${crudMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {crudMessage.text}
            </div>
          </div>
        )}

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {user?.role !== 'VIEWER' && (
              <button
                onClick={() => setActiveTab('summary')}
                className={`${activeTab === 'summary' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Summary
              </button>
            )}
            <button
              onClick={() => setActiveTab('records')}
              className={`${activeTab === 'records' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Records
            </button>
            {user?.role !== 'VIEWER' && (
              <>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`${activeTab === 'categories' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Categories
                </button>
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`${activeTab === 'recent' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Recent
                </button>
              </>
            )}
          </nav>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {activeTab === 'summary' && !loading && user?.role !== 'VIEWER' && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">+</span>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Total Income</p>
                  <p className="text-lg font-semibold text-gray-900">{summary ? formatCurrency(summary.totalIncome) : '$0.00'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">-</span>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                  <p className="text-lg font-semibold text-gray-900">{summary ? formatCurrency(summary.totalExpenses) : '$0.00'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <div className="flex items-center">
                <div className={`w-8 h-8 ${summary && summary.netBalance >= 0 ? 'bg-blue-500' : 'bg-orange-500'} rounded-md flex items-center justify-center`}>
                  <span className="text-white text-lg">=</span>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Net Balance</p>
                  <p className={`text-lg font-semibold ${summary && summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary ? formatCurrency(summary.netBalance) : '$0.00'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">#</span>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Total Records</p>
                  <p className="text-lg font-semibold text-gray-900">{summary ? summary.totalRecords : 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'records' && !loading && (
          <div>
            {isAdmin && (
              <div className="mb-4">
                {!showCreateForm ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    disabled={crudLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    + Create Record
                  </button>
                ) : (
                  <div className="bg-white shadow rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Record</h3>
                    <form onSubmit={handleCreateRecord} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                          <label htmlFor="create-amount" className="block text-sm font-medium text-gray-700">Amount *</label>
                          <div className="mt-1 flex items-center">
                            <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm rounded-l-md">₹</span>
                            <input type="number" id="create-amount" step="0.01" min="0.01" required value={createFormData.amount} onChange={(e) => setCreateFormData({ ...createFormData, amount: e.target.value })} className="block w-full rounded-none rounded-r-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2" placeholder="0.00" />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="create-type" className="block text-sm font-medium text-gray-700">Type *</label>
                          <select id="create-type" required value={createFormData.type} onChange={(e) => setCreateFormData({ ...createFormData, type: e.target.value as 'INCOME' | 'EXPENSE' })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2">
                            <option value="EXPENSE">EXPENSE</option>
                            <option value="INCOME">INCOME</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="create-category" className="block text-sm font-medium text-gray-700">Category *</label>
                          <input type="text" id="create-category" required value={createFormData.category} onChange={(e) => setCreateFormData({ ...createFormData, category: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2" placeholder="e.g., Groceries" />
                        </div>
                        <div>
                          <label htmlFor="create-date" className="block text-sm font-medium text-gray-700">Date *</label>
                          <input type="date" id="create-date" required value={createFormData.date} onChange={(e) => setCreateFormData({ ...createFormData, date: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2" />
                        </div>
                        <div>
                          <label htmlFor="create-notes" className="block text-sm font-medium text-gray-700">Notes</label>
                          <input type="text" id="create-notes" value={createFormData.notes} onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2" placeholder="Optional notes" />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button type="button" onClick={() => { setShowCreateForm(false); setCreateFormData(initialFormData); }} disabled={crudLoading} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={crudLoading} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">{crudLoading ? 'Creating...' : 'Create Record'}</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {crudLoading && (
              <div className="mb-4 flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mr-2"></div>
                <span className="text-sm text-gray-600">Processing...</span>
              </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    {isAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.length === 0 ? (
                    <tr><td colSpan={isAdmin ? 6 : 5} className="px-6 py-4 text-center text-sm text-gray-500">No records found</td></tr>
                  ) : (
                    records.map((record) => (
                      editingRecordId === record.id ? (
                        <tr key={record.id} className="bg-indigo-50">
                          <td className="px-6 py-4">
                            <select value={editFormData.type} onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as 'INCOME' | 'EXPENSE' })} className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm border px-2 py-1">
                              <option value="EXPENSE">EXPENSE</option>
                              <option value="INCOME">INCOME</option>
                            </select>
                          </td>
                          <td className="px-6 py-4"><input type="text" value={editFormData.category} onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm border px-2 py-1" required /></td>
                          <td className="px-6 py-4"><input type="number" step="0.01" min="0.01" value={editFormData.amount} onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })} className="block w-24 rounded-md border-gray-300 shadow-sm sm:text-sm border px-2 py-1" required /></td>
                          <td className="px-6 py-4"><input type="date" value={editFormData.date} onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm border px-2 py-1" required /></td>
                          <td className="px-6 py-4"><input type="text" value={editFormData.notes} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm border px-2 py-1" placeholder="Notes" /></td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={(e) => handleUpdateRecord(e, record)} disabled={crudLoading} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">{crudLoading ? '...' : 'Save'}</button>
                            <button onClick={cancelEdit} disabled={crudLoading} className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{record.type}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.category}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${record.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>{record.type === 'INCOME' ? '+' : '-'}{formatCurrency(record.amount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(record.date)}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{record.notes || '-'}</td>
                          {isAdmin && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              <button onClick={() => startEditRecord(record)} disabled={crudLoading || editingRecordId !== null} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50">Edit</button>
                              <button onClick={() => handleDeleteRecord(record.id)} disabled={crudLoading || editingRecordId !== null} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50">Delete</button>
                            </td>
                          )}
                        </tr>
                      )
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'categories' && !loading && user?.role !== 'VIEWER' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No category data available</td></tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.category}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{formatCurrency(category.income)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{formatCurrency(category.expenses)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${category.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(category.net)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'recent' && !loading && user?.role !== 'VIEWER' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Last 10 financial records</p>
            </div>
            <ul className="divide-y divide-gray-200">
              {recentRecords.length === 0 ? (
                <li className="px-4 py-4 text-center text-sm text-gray-500">No recent activity</li>
              ) : (
                recentRecords.map((record) => (
                  <li key={record.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${record.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'}`}>
                          <span className={`text-sm font-medium ${record.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>{record.type === 'INCOME' ? '+' : '-'}</span>
                        </span>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{record.category}</p>
                          <p className="text-sm text-gray-500">{record.notes || 'No notes'} - {record.createdBy?.name || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${record.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>{record.type === 'INCOME' ? '+' : '-'}{formatCurrency(record.amount)}</p>
                        <p className="text-sm text-gray-500">{formatDate(record.date)}</p>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {user?.role === 'VIEWER' && activeTab !== 'records' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-700">As a Viewer, you can only access the Records tab. Dashboard analytics are available for Analysts and Admins.</p>
          </div>
        )}
      </main>
    </div>
  );
}
