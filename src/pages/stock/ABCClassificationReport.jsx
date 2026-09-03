import { useState, useEffect } from 'react';
import { Target, Scale, BarChart3 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Table from '../../components/tables/Table';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function ABCClassificationReport() {
  const { showToast } = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('A');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stock/reports/abc-classification', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      const json = await response.json();
      if (json.success) {
        setReport(json.data);
      } else {
        showToast('Failed to load ABC classification report', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading ABC Classification Report...</div>;
  if (!report) return <div className="text-center py-8 text-red-600">Failed to load report</div>;

  const chartData = [
    { name: 'Class A', count: report.classifications.A.count, value: parseFloat(report.classifications.A.totalValue) },
    { name: 'Class B', count: report.classifications.B.count, value: parseFloat(report.classifications.B.totalValue) },
    { name: 'Class C', count: report.classifications.C.count, value: parseFloat(report.classifications.C.totalValue) }
  ];

  const currentClass = report.classifications[selectedClass];
  const columns = [
    { header: 'Item Code', accessor: 'code', className: 'font-mono font-semibold' },
    { header: 'Item Name', accessor: 'name' },
    { header: 'Quantity', accessor: 'quantity', render: (row) => `${row.quantity} ${row.quantity > 0 ? '✓' : '✗'}` },
    { header: 'Stock Value', accessor: 'value', render: (row) => `RWF ${row.value?.toLocaleString() || 0}` },
    { header: 'Location', accessor: 'location' },
    { header: 'Status', accessor: 'quantity', render: (row) => {
      if (row.quantity > row.minLevel) return <Badge variant="success">In Stock</Badge>;
      if (row.quantity > 0) return <Badge variant="warning">Low Stock</Badge>;
      return <Badge variant="error">Out of Stock</Badge>;
    }}
  ];

  const getClassColor = (cls) => {
    switch (cls) {
      case 'A': return '#10b981';
      case 'B': return '#f59e0b';
      case 'C': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getClassLabel = (cls) => {
    switch (cls) {
      case 'A': return 'High-Value';
      case 'B': return 'Medium-Value';
      case 'C': return 'Low-Value';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-dark-gray)]">ABC Classification Analysis</h1>
        <p className="mt-2 text-[var(--color-mid-gray)]">Inventory analysis classifying items by value to optimize stock management focus.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="p-6">
            <p className="text-sm font-semibold text-gray-600 uppercase">Total Items</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{report.summary.totalItems}</p>
            <p className="text-xs text-gray-500 mt-2">Active stock items</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="p-6">
            <p className="text-sm font-semibold text-green-600 uppercase">Class A Items</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{report.classifications.A.count}</p>
            <p className="text-xs text-green-700 mt-2">{report.classifications.A.percentage}% of value</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="p-6">
            <p className="text-sm font-semibold text-amber-600 uppercase">Class B Items</p>
            <p className="text-3xl font-bold text-amber-900 mt-2">{report.classifications.B.count}</p>
            <p className="text-xs text-amber-700 mt-2">{report.classifications.B.percentage}% of value</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="p-6">
            <p className="text-sm font-semibold text-red-600 uppercase">Class C Items</p>
            <p className="text-3xl font-bold text-red-900 mt-2">{report.classifications.C.count}</p>
            <p className="text-xs text-red-700 mt-2">{report.classifications.C.percentage}% of value</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Items by Classification</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Value Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: RWF ${value?.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `RWF ${value?.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Classification Details */}
      <Card>
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Classification Details</h2>
            <div className="flex gap-2">
              {['A', 'B', 'C'].map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-4 py-2 rounded font-semibold transition border ${
                    selectedClass === cls
                      ? 'bg-[var(--gold)] text-white border-[var(--gold)] shadow-[0_8px_20px_rgba(15,108,255,0.18)]'
                      : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--gold)]'
                  }`}
                >
                  Class {cls} ({report.classifications[cls].count})
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900">{currentClass.label}</h3>
            <p className="text-sm text-blue-700 mt-1">{currentClass.description}</p>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-blue-600 font-semibold">{currentClass.count} Items</p>
              </div>
              <div>
                <p className="text-blue-600 font-semibold">RWF {parseFloat(currentClass.totalValue).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-blue-600 font-semibold">{currentClass.percentage}% of Total Value</p>
              </div>
            </div>
          </div>

          <Table columns={columns} data={currentClass.items} />
        </div>
      </Card>

      {/* Key Insights */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Insights & Recommendations</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Class A (High-Value Items)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Focus tight inventory control. Implement periodic cycle counts, maintain detailed records, and ensure rapid reorder response. These items drive significant value.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Scale className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Class B (Medium-Value Items)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Apply standard inventory practices. Monitor regularly and maintain normal reorder points. Balance between control and operational efficiency.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-red-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Class C (Low-Value Items)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Simpler controls are acceptable. Use higher reorder points, larger lot sizes, and less frequent reviews to reduce administrative overhead.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
