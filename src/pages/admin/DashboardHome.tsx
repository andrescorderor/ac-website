import { motion } from 'framer-motion';
import { 
  HiOutlineCube, 
  HiOutlineChartBar, 
  HiOutlineGlobeAlt, 
  HiOutlineLightningBolt 
} from 'react-icons/hi';

const stats = [
  { label: 'Total Projects', value: '12', icon: HiOutlineCube, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Weekly Impact', value: '+24%', icon: HiOutlineChartBar, color: 'text-green-500', bg: 'bg-green-50' },
  { label: 'Site Visitors', value: '1.2k', icon: HiOutlineGlobeAlt, color: 'text-purple-500', bg: 'bg-purple-50' },
  { label: 'Active Tasks', value: '4', icon: HiOutlineLightningBolt, color: 'text-orange-500', bg: 'bg-orange-50' },
];

export default function DashboardHome() {
  return (
    <div className="space-y-12">
      <header>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-dm-sans text-4xl lg:text-5xl font-bold tracking-tight text-[var(--black)]"
        >
          Welcome back, <span className="text-gradient">Andrés</span>
        </motion.h1>
        <p className="font-inter mt-4 text-[var(--dark-gray)] font-light text-lg">
          Here's what's happening with your strategic core today.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group"
          >
            <div className={`size-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <stat.icon className="text-3xl" />
            </div>
            <p className="font-syne text-xs font-bold uppercase tracking-widest text-[var(--gray)] mb-2">{stat.label}</p>
            <h3 className="font-dm-sans text-4xl font-bold text-[var(--black)]">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Placeholder for Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-dm-sans text-2xl font-bold">Recent Activity</h2>
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 min-h-[400px] flex items-center justify-center text-[var(--gray)] font-inter font-light italic">
            Activity stream will appear here as you integrate more tools.
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="font-dm-sans text-2xl font-bold">Quick Actions</h2>
          <div className="space-y-4">
            {['Create New Project', 'Update Analytics', 'Backup Database'].map((action) => (
              <button 
                key={action}
                className="w-full p-6 bg-white border border-gray-100 rounded-2xl text-left font-syne text-xs font-bold uppercase tracking-widest hover:border-[var(--black)] hover:bg-[var(--soft-light-gray)] transition-all duration-300"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
