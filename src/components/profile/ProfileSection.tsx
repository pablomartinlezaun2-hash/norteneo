import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Settings, 
  Bell, 
  Dumbbell, 
  Shield, 
  Scale, 
  Globe, 
  Heart, 
  Puzzle,
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  BookOpen,
  HelpCircle,
  MessageCircle,
  Mail,
  Info,
  ChevronRight,
  Crown,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark' | 'system';

interface SettingItem {
  icon: typeof Settings;
  label: string;
  sublabel?: string;
  action?: () => void;
  hasArrow?: boolean;
  rightElement?: React.ReactNode;
}

interface SettingGroup {
  title: string;
  items: SettingItem[];
}

export const ProfileSection = () => {
  const { user, signOut } = useAuth();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    // In a real app, this would update the theme
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (mode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const settingGroups: SettingGroup[] = [
    {
      title: 'Cuenta',
      items: [
        { 
          icon: Crown, 
          label: 'PRO', 
          sublabel: 'Gestionar suscripción', 
          hasArrow: true 
        },
        { 
          icon: Bell, 
          label: 'Notificaciones', 
          hasArrow: true 
        },
      ],
    },
    {
      title: 'Preferencias',
      items: [
        { icon: Dumbbell, label: 'Entrenamientos', hasArrow: true },
        { icon: Shield, label: 'Privacidad', hasArrow: true },
        { icon: Scale, label: 'Unidades', hasArrow: true },
        { icon: Globe, label: 'Idioma', sublabel: 'Español', hasArrow: true },
        { icon: Heart, label: 'Salud y actividad', hasArrow: true },
        { icon: Puzzle, label: 'Integraciones', hasArrow: true },
      ],
    },
    {
      title: 'Datos',
      items: [
        { icon: Download, label: 'Exportar datos', hasArrow: false },
        { icon: Upload, label: 'Importar datos', hasArrow: false },
      ],
    },
    {
      title: 'Soporte',
      items: [
        { icon: BookOpen, label: 'Guía rápida', hasArrow: true },
        { icon: Dumbbell, label: 'Ayuda de entrenamientos', hasArrow: true },
        { icon: HelpCircle, label: 'Preguntas frecuentes', hasArrow: true },
        { icon: Mail, label: 'Contacto', hasArrow: true },
      ],
    },
  ];

  const SocialIcon = ({ type }: { type: 'instagram' | 'tiktok' | 'youtube' | 'x' }) => {
    const iconClasses = "w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-110";
    
    switch (type) {
      case 'instagram':
        return (
          <motion.a
            href="#"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={cn(iconClasses, "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400")}
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </motion.a>
        );
      case 'youtube':
        return (
          <motion.a
            href="#"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={cn(iconClasses, "bg-red-600")}
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </motion.a>
        );
      case 'tiktok':
        return (
          <motion.a
            href="#"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={cn(iconClasses, "bg-foreground")}
          >
            <svg className="w-5 h-5 text-background" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </motion.a>
        );
      case 'x':
        return (
          <motion.a
            href="#"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={cn(iconClasses, "bg-foreground")}
          >
            <svg className="w-4 h-4 text-background" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </motion.a>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
        >
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Perfil</span>
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">Configuración</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Personaliza tu experiencia
        </p>
      </div>

      {/* User Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="gradient-card rounded-2xl p-5 border border-border apple-shadow"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-foreground truncate">
              {user?.email?.split('@')[0] || 'Usuario'}
            </p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Setting Groups */}
      {settingGroups.map((group, groupIndex) => (
        <motion.div
          key={group.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + groupIndex * 0.05 }}
          className="gradient-card rounded-2xl border border-border apple-shadow overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group.title}
            </h3>
          </div>
          <div className="divide-y divide-border">
            {group.items.map((item, itemIndex) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    {item.sublabel && (
                      <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                    )}
                  </div>
                  {item.hasArrow && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  {item.rightElement}
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="gradient-card rounded-2xl border border-border apple-shadow overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Apariencia
          </h3>
        </div>
        <div className="p-4">
          <div className="flex gap-2">
            {[
              { mode: 'light' as ThemeMode, icon: Sun, label: 'Claro' },
              { mode: 'dark' as ThemeMode, icon: Moon, label: 'Oscuro' },
              { mode: 'system' as ThemeMode, icon: Monitor, label: 'Sistema' },
            ].map(({ mode, icon: Icon, label }) => (
              <motion.button
                key={mode}
                onClick={() => handleThemeChange(mode)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 py-3 rounded-xl transition-all",
                  themeMode === mode
                    ? "gradient-primary text-primary-foreground glow-primary"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* About */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="gradient-card rounded-2xl border border-border apple-shadow overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sobre la app
          </h3>
        </div>
        <div className="p-4">
          <button className="w-full flex items-center gap-3 py-2 hover:bg-muted/50 rounded-xl transition-colors">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Info className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">NEO Workout</p>
              <p className="text-xs text-muted-foreground">Versión 1.0.0</p>
            </div>
          </button>
          
          {/* Social Links */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3 text-center">Síguenos</p>
            <div className="flex justify-center gap-4">
              <SocialIcon type="youtube" />
              <SocialIcon type="tiktok" />
              <SocialIcon type="instagram" />
              <SocialIcon type="x" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          variant="outline"
          onClick={signOut}
          className="w-full h-12 text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar sesión
        </Button>
      </motion.div>
    </motion.div>
  );
};
