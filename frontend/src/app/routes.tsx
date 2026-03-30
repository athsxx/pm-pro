import React from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { ProjectsList } from './components/Projects';
import { ProjectDetail } from './components/ProjectDetail';
import { Login } from './components/Login';
import { MobileNotifications } from './components/MobileNotifications';
import { TaskQuickUpdate } from './components/TaskQuickUpdate';
import { MyTasks } from './components/MyTasks';
import { MobileSettings } from './components/MobileSettings';

/** Routes match `src/app/stitch/README.md` (Clean Utility screens only). */
export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    Component: RequireAuth,
    children: [
      {
        path: '/',
        Component: Layout,
        children: [
          { index: true, Component: MyTasks },
          { path: 'projects', Component: ProjectsList },
          { path: 'projects/:id', Component: ProjectDetail },
          { path: 'notifications', Component: MobileNotifications },
          { path: 'task-quick-update', Component: TaskQuickUpdate },
          { path: 'settings', Component: MobileSettings },
        ],
      },
    ],
  },
]);
