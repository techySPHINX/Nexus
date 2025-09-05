import React from 'react';
import { Project } from '@/types/profileType';
import { Card, CardContent, Typography, Box, Chip, Grid } from '@mui/material';

interface ProjectsSectionProps {
  projects: Project[];
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ projects }) => (
  <Box>
    <Typography
      variant="h6"
      sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
    >
      Projects
    </Typography>
    {projects && projects.length > 0 ? (
      <Grid container spacing={2}>
        {projects.map((project) => (
          <Grid item xs={12} sm={6} key={project.id}>
            <Card variant="outlined" sx={{ minHeight: 180 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {project.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {project.description}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {project.tags.map((tag, idx) => (
                    <Chip
                      key={idx}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    ) : (
      <Typography variant="body2" color="text.secondary">
        No projects yet
      </Typography>
    )}
  </Box>
);

export default ProjectsSection;
