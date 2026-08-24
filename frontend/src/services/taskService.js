import { apiClient, USE_MOCK_API } from './apiClient';
import taskMock from '../../../contracts/examples/task-response.json';

export const taskService = {
  getTasks: async (filters = {}) => {
    try {
      const res = await apiClient.get('/tasks', { params: filters });
      return res.data;
    } catch (err) {
      return taskMock.tasks || [];
    }
  },

  getOverdueTasks: async () => {
    try {
      const res = await apiClient.get('/tasks/overdue');
      return res.data;
    } catch (err) {
      return (taskMock.tasks || []).filter(t => t.is_overdue);
    }
  },

  createTask: async (taskData) => {
    const res = await apiClient.post('/tasks', taskData);
    return res.data;
  },

  updateTask: async (id, updateData) => {
    const res = await apiClient.put(`/tasks/${id}`, updateData);
    return res.data;
  }
};
