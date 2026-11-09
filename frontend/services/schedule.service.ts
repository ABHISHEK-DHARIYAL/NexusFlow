import axios from 'axios';
import { ScheduledJob, ScheduledJobExecution, AutomationTemplate, AutomationSummary } from '../types';

const API_BASE = '/api/schedules';

export const scheduleService = {
  async getSchedules(): Promise<ScheduledJob[]> {
    const res = await axios.get(API_BASE);
    return res.data.data || [];
  },

  async getSummary(): Promise<AutomationSummary> {
    const res = await axios.get(`${API_BASE}/summary`);
    return res.data.data;
  },

  async getTemplates(): Promise<AutomationTemplate[]> {
    const res = await axios.get(`${API_BASE}/templates`);
    return res.data.data || [];
  },

  async getScheduleById(id: string): Promise<ScheduledJob> {
    const res = await axios.get(`${API_BASE}/${id}`);
    return res.data.data;
  },

  async createSchedule(data: {
    name: string;
    description?: string;
    jobType: string;
    frequency: string;
    schedule?: string;
    time?: string;
    timezone?: string;
    resourceId?: string;
  }): Promise<ScheduledJob> {
    const res = await axios.post(API_BASE, data);
    return res.data.data;
  },

  async updateSchedule(
    id: string,
    data: {
      name?: string;
      description?: string;
      frequency?: string;
      schedule?: string;
      time?: string;
      timezone?: string;
      resourceId?: string;
    }
  ): Promise<ScheduledJob> {
    const res = await axios.patch(`${API_BASE}/${id}`, data);
    return res.data.data;
  },

  async enableSchedule(id: string): Promise<ScheduledJob> {
    const res = await axios.post(`${API_BASE}/${id}/enable`);
    return res.data.data;
  },

  async disableSchedule(id: string): Promise<ScheduledJob> {
    const res = await axios.post(`${API_BASE}/${id}/disable`);
    return res.data.data;
  },

  async deleteSchedule(id: string): Promise<boolean> {
    const res = await axios.delete(`${API_BASE}/${id}`);
    return res.data.success;
  },

  async getExecutions(id: string): Promise<ScheduledJobExecution[]> {
    const res = await axios.get(`${API_BASE}/${id}/executions`);
    return res.data.data || [];
  },

  async runNow(id: string): Promise<ScheduledJobExecution> {
    const res = await axios.post(`${API_BASE}/${id}/run-now`);
    return res.data.data;
  },
};
