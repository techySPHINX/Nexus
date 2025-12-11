import { FC, useState } from 'react';
import { useShowcase } from '@/contexts/ShowcaseContext';
import {
  ProjectDetailInterface,
  CreateProjectInterface,
} from '@/types/ShowcaseType';
import ProjectModal from './CreateProject';
import { useNotification } from '@/contexts/NotificationContext';

interface UpdateProjectModalProps {
  open: boolean;
  project?: ProjectDetailInterface | null;
  onClose: () => void;
  onUpdated?: (project: ProjectDetailInterface) => void;
}

const UpdateProjectModal: FC<UpdateProjectModalProps> = ({
  open,
  project: propProject,
  onClose,
  onUpdated,
}) => {
  const { projectById, updateProject, refreshProjects, getProjectsByUserId } =
    useShowcase();
  const effectiveProject: ProjectDetailInterface | null =
    (propProject as ProjectDetailInterface) || projectById || null;

  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const handleSubmit = async (data: CreateProjectInterface) => {
    if (!effectiveProject) return;
    setSaving(true);
    try {
      await updateProject(effectiveProject.id, data);

      // Try to refresh lists (best-effort)
      try {
        await refreshProjects(1);
      } catch {
        try {
          await getProjectsByUserId?.(effectiveProject.owner?.id);
        } catch {
          // ignore
        }
      }

      if (onUpdated) {
        const updated: ProjectDetailInterface = {
          ...(effectiveProject as ProjectDetailInterface),
          ...data,
          title: data.title || effectiveProject.title,
          description: data.description || effectiveProject.description,
          status: data.status || effectiveProject.status,
          githubUrl: data.githubUrl || effectiveProject.githubUrl,
          websiteUrl: data.websiteUrl || effectiveProject.websiteUrl,
          videoUrl: data.videoUrl || effectiveProject.videoUrl,
          imageUrl: data.imageUrl || effectiveProject.imageUrl,
          tags: data.tags || effectiveProject.tags,
          skills: data.skills || effectiveProject.skills,
          seeking: data.seeking || effectiveProject.seeking,
        } as ProjectDetailInterface;
        onUpdated(updated);
      }

      showNotification?.('Project updated!', 'success');
      // close modal after a short delay so user can see the success snackbar
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err) {
      console.error('Failed to update project', err);
      showNotification?.('Failed to update project', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <ProjectModal
        project={effectiveProject as ProjectDetailInterface}
        onClose={onClose}
        onSubmit={handleSubmit}
        loading={saving}
      />

      {/* Notifications handled by NotificationProvider */}
    </>
  );
};

export default UpdateProjectModal;
