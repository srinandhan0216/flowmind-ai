import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Dashboard } from '../pages/Dashboard';
import { RequestInbox } from '../pages/RequestInbox';
import { CreateRequest } from '../pages/CreateRequest';
import { RequestDetails } from '../pages/RequestDetails';
import { WorkflowBuilder } from '../pages/WorkflowBuilder';
import { Analytics } from '../pages/Analytics';
import { SettingsPage } from '../pages/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Main SaaS Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Requests lifecycle */}
          <Route path="requests" element={<RequestInbox />} />
          <Route path="requests/new" element={<CreateRequest />} />
          <Route path="requests/:id" element={<RequestDetails />} />

          {/* Workflow Builder & Studio */}
          <Route path="workflows" element={<WorkflowBuilder />} />

          {/* Operational Analytics */}
          <Route path="analytics" element={<Analytics />} />

          {/* Platform Settings */}
          <Route path="settings" element={<SettingsPage />} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
