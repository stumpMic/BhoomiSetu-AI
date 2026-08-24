using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace BhoomiSetuLauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string pythonExe = @"C:\Users\HP\python311\python.exe";
                if (!File.Exists(pythonExe))
                {
                    pythonExe = "python";
                }

                // 1. Check if backend is running (port 8000)
                bool backendRunning = IsUrlResponding("http://localhost:8000/api/health");
                if (!backendRunning)
                {
                    ProcessStartInfo backendPsi = new ProcessStartInfo();
                    backendPsi.FileName = pythonExe;
                    backendPsi.Arguments = "-m uvicorn app.main:app --app-dir backend --port 8000 --host 0.0.0.0";
                    backendPsi.WorkingDirectory = baseDir;
                    backendPsi.WindowStyle = ProcessWindowStyle.Hidden;
                    backendPsi.CreateNoWindow = true;
                    backendPsi.UseShellExecute = false;
                    Process.Start(backendPsi);
                }

                // 2. Check if frontend is running (port 5173)
                bool frontendRunning = IsUrlResponding("http://localhost:5173");
                if (!frontendRunning)
                {
                    string npmPath = @"C:\Program Files\nodejs\npm.cmd";
                    if (!File.Exists(npmPath)) npmPath = "npm.cmd";

                    ProcessStartInfo frontendPsi = new ProcessStartInfo();
                    frontendPsi.FileName = npmPath;
                    frontendPsi.Arguments = "run dev -- --host 0.0.0.0 --port 5173";
                    frontendPsi.WorkingDirectory = Path.Combine(baseDir, "frontend");
                    frontendPsi.WindowStyle = ProcessWindowStyle.Hidden;
                    frontendPsi.CreateNoWindow = true;
                    frontendPsi.UseShellExecute = false;
                    Process.Start(frontendPsi);
                }

                // Wait 2 seconds for services to ensure ready
                Thread.Sleep(1500);

                // 3. Open default browser to BhoomiSetu AI Web App
                Process.Start("http://localhost:5173");
            }
            catch (Exception ex)
            {
                MessageBox.Show("Could not launch BhoomiSetu AI: " + ex.Message, "BhoomiSetu AI Launcher", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        static bool IsUrlResponding(string url)
        {
            try
            {
                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
                request.Timeout = 1500;
                request.Method = "GET";
                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                {
                    return response.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }
    }
}
