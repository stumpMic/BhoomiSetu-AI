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
    try {
      const res = await apiClient.post('/tasks', taskData);
      return res.data;
    } catch (err) {
      const newTask = {
        id: Date.now(),
        ...taskData,
        assigned_department_name: taskData.assigned_department_name || "Survey & Revenue Department",
        status: "To do",
        is_overdue: false,
        created_at: new Date().toISOString()
      };
      if (taskMock.tasks) {
        taskMock.tasks.unshift(newTask);
      }
      return newTask;
    }
  },

  updateTask: async (id, updateData) => {
    try {
      const res = await apiClient.put(`/tasks/${id}`, updateData);
      return res.data;
    } catch (err) {
      if (taskMock.tasks) {
        const idx = taskMock.tasks.findIndex(t => t.id === id);
        if (idx !== -1) {
          taskMock.tasks[idx] = { ...taskMock.tasks[idx], ...updateData };
          return taskMock.tasks[idx];
        }
      }
      return { id, ...updateData };
    }
  },

  getSurveyOfficers: async () => {
    return [
      { id: 4, full_name: "Shri Rajesh Jena", role: "survey_officer", department: "Cadastral Survey & Mapping" },
      { id: 5, full_name: "Smt. Priyadarshini Sahoo", role: "survey_officer", department: "Joint Field Verification" },
      { id: 6, full_name: "Shri Manoj Kumar Swain", role: "survey_officer", department: "Revenue Survey Wing" }
    ];
  }
};
