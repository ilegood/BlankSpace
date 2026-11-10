import React from 'react';
import {
  FileText,
  Share2,
  MessageSquare,
  Globe,
  MapPin,
  Clock,
  Book,
  Gamepad2,
  GitBranch,
  Layout,
  Shield,
  Palette,
  Box,
  Film,
  Volume2,
  CheckSquare,
  Users,
  Lightbulb,
  Calendar,
  FolderArchive,
  Folder,
  User,
  Image,
  Sparkles,
  HelpCircle
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  FileText,
  Share2,
  MessageSquare,
  Globe,
  MapPin,
  Clock,
  Book,
  Gamepad2,
  GitBranch,
  Layout,
  Shield,
  Palette,
  Box,
  Film,
  Volume2,
  CheckSquare,
  Users,
  Lightbulb,
  Calendar,
  FolderArchive,
  Folder,
  User,
  Image,
  Sparkles,
};

export function getTemplateIcon(name: string, className: string = 'w-5 h-5'): React.ReactNode {
  const Component = ICON_MAP[name] || HelpCircle;
  return <Component className={className} />;
}

