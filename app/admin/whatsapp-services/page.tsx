"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Smartphone, Wifi, WifiOff, QrCode, Users, MessageSquare, Settings, RefreshCw, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type WhatsAppStatus = "DISCONNECTED" | "CONNECTING" | "QR_READY" | "CONNECTED" | "AUTHENTICATING" | "ERROR";

interface WhatsAppStats {
  status: WhatsAppStatus;
  qrCode?: string;
  info?: any;
  loadingPercent?: number;
  loadingMessage?: string;
  authorizedUsers: number;
  error?: string;
}

interface TestMessageData {
  receiver: string;
  message: string;
}

export default function WhatsAppServicesPage() {
  const [stats, setStats] = useState<WhatsAppStats>({
    status: "DISCONNECTED",
    authorizedUsers: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [testMessage, setTestMessage] = useState<TestMessageData>({
    receiver: "",
    message: ""
  });
  const [newAuthorizedNumber, setNewAuthorizedNumber] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto refresh status every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWhatsAppStatus();
    }, 3000);

    // Initial fetch
    fetchWhatsAppStatus();

    return () => clearInterval(interval);
  }, []);

const fetchWhatsAppStatus = async () => {
    try {
      const [statusResponse, usersResponse] = await Promise.all([
        fetch('/api/whatsapp/status'),
        fetch('/api/whatsapp/authorized-users')
      ]);

      const statusData = await statusResponse.json();
      const usersData = await usersResponse.json();

      setStats({
        status: statusData.status,
        qrCode: statusData.qrCode,
        info: statusData.info,
        loadingPercent: statusData.loadingPercent,
        loadingMessage: statusData.loadingMessage,
        authorizedUsers: usersData.total || 0,
        error: statusData.error
      });
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
      setStats(prev => ({
        ...prev,
        status: "ERROR",
        error: "Failed to fetch status"
      }));
    }
  };

  const initializeWhatsApp = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/initialize', {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchWhatsAppStatus();
      }
    } catch (error) {
      console.error('Error initializing WhatsApp:', error);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWhatsApp = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchWhatsAppStatus();
      }
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopInitialize = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/stop-initialize', {
        method: 'POST'
      });

      if (response.ok) {
        fetchWhatsAppStatus();
      }
    } catch (error) {
      console.error('Error stopping WhatsApp initialization:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testMessage.receiver || !testMessage.message) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testMessage)
      });
      
      const result = await response.json();
      if (result.success) {
        setTestMessage({ receiver: "", message: "" });
        alert('Pesan berhasil dikirim!');
      } else {
        alert('Gagal mengirim pesan: ' + result.error);
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      alert('Error mengirim pesan');
    } finally {
      setLoading(false);
    }
  };

  const addAuthorizedUser = async () => {
    if (!newAuthorizedNumber) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/add-authorized-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: newAuthorizedNumber })
      });
      
      const result = await response.json();
      if (result.success) {
        setNewAuthorizedNumber("");
        fetchWhatsAppStatus();
        alert('User berhasil ditambahkan!');
      } else {
        alert('Gagal menambahkan user: ' + result.message);
      }
    } catch (error) {
      console.error('Error adding authorized user:', error);
      alert('Error menambahkan user');
    } finally {
      setLoading(false);
    }
  };

  const resetAllSession = async () => {
    if (!confirm('⚠️ Perhatian! Ini akan memaksa disconnect dan mereset WhatsApp (termasuk menghapus folder session) Lanjutkan?')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/reset-all-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (response.ok) {
        fetchWhatsAppStatus();
        alert('✅ WhatsApp berhasil dipaksa disconnect dan session direset!');
      } else {
        alert('❌ Gagal mereset session: ' + result.error);
      }
    } catch (error) {
      console.error('Error resetting all session:', error);
      alert('Error mereset session');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = () => {
    setIsRefreshing(true);
    fetchWhatsAppStatus();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusColor = () => {
    switch (stats.status) {
      case "CONNECTED": return "bg-green-500";
      case "CONNECTING": 
      case "AUTHENTICATING": return "bg-yellow-500";
      case "QR_READY": return "bg-blue-500";
      case "ERROR": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (stats.status) {
      case "CONNECTED": return "Terhubung";
      case "CONNECTING": return "Menghubungkan...";
      case "AUTHENTICATING": return "Mengautentikasi...";
      case "QR_READY": return "QR Code Siap";
      case "ERROR": return "Error";
      default: return "Terputus";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Smartphone className="h-8 w-8" />
            WhatsApp Services
          </h1>
          <p className="text-muted-foreground">
            Kelola koneksi WhatsApp dan monitor aktivitas chatbot
          </p>
        </div>
        <Button onClick={refreshStatus} disabled={isRefreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Koneksi</CardTitle>
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusText()}</div>
            {stats.loadingPercent !== undefined && (
              <div className="mt-2 space-y-1">
                <Progress value={stats.loadingPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">{stats.loadingMessage}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Terotorisasi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.authorizedUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.authorizedUsers === 0 ? "Semua user diizinkan" : "User yang dapat menggunakan bot"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Info Client</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.info?.pushname || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.info?.wid?.user || "Tidak terhubung"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {stats.error && (
        <Alert variant="destructive">
          <AlertDescription>{stats.error}</AlertDescription>
        </Alert>
      )}

      {/* Reset All Session Alert Card */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-600">Reset Seluruh Session</CardTitle>
            </div>
            <Button 
              onClick={resetAllSession} 
              disabled={loading} 
              variant="destructive"
              size="sm"
            >
              Reset Session
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-red-700">
          <p>
            Gunakan tombol ini jika mengalami bug atau masalah koneksi. Ini akan:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Disconnect WhatsApp Client</li>
            <li>Menghapus seluruh file session dan auth</li>
            <li>Reset status ke DISCONNECTED</li>
          </ul>
          <p className="mt-2 font-medium">⚠️ Setelah reset, Anda perlu scan QR Code lagi</p>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* QR Code & Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Koneksi WhatsApp
            </CardTitle>
            <CardDescription>
              Scan QR code untuk menghubungkan WhatsApp atau kelola koneksi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.status === "DISCONNECTED" && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-sm text-gray-600">
                    WhatsApp belum terhubung. Klik tombol di bawah untuk memulai koneksi.
                  </p>
                </div>
                <Button onClick={initializeWhatsApp} disabled={loading} className="w-full">
                  <Wifi className="h-4 w-4 mr-2" />
                  Hubungkan WhatsApp
                </Button>
              </div>
            )}
            
            {stats.status === "QR_READY" && stats.qrCode && (
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg inline-block border shadow-sm">
                  <img 
                    src={stats.qrCode} 
                    alt="WhatsApp QR Code" 
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Scan QR code ini dengan WhatsApp Anda
                  </p>
                  <Badge variant="secondary">QR Code akan expire dalam 20 detik</Badge>
                  <p className="text-xs text-muted-foreground">
                    Buka WhatsApp → Menu (3 titik) → WhatsApp Web → Scan QR Code
                  </p>
                </div>
              </div>
            )}
            
            {stats.status === "AUTHENTICATING" && (
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <div>
                  <p className="text-sm font-medium">Mengautentikasi...</p>
                  <p className="text-xs text-muted-foreground">QR Code telah di-scan, sedang memproses login</p>
                </div>
              </div>
            )}

            {stats.status === "CONNECTED" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span>WhatsApp terhubung dan siap digunakan</span>
                </div>
                {stats.info && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800">
                      Terhubung sebagai: {stats.info.pushname || 'Unknown'}
                    </p>
                    <p className="text-xs text-green-600">
                      Nomor: {stats.info.wid?.user || 'Unknown'}
                    </p>
                  </div>
                )}
                <Button onClick={disconnectWhatsApp} disabled={loading} variant="destructive" className="w-full">
                  <WifiOff className="h-4 w-4 mr-2" />
                  Putuskan Koneksi
                </Button>
              </div>
            )}

            {stats.status === "CONNECTING" && (
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <div>
                  <p className="text-sm font-medium">Menghubungkan...</p>
                  {stats.loadingPercent !== undefined && stats.loadingMessage && (
                    <>
                      <Progress value={stats.loadingPercent} className="h-2 mt-2" />
                      <p className="text-xs text-muted-foreground mt-1">{stats.loadingMessage}</p>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">Sedang memuat WhatsApp Web...</p>
                </div>
                <Button onClick={stopInitialize} disabled={loading} variant="outline" className="w-full">
                  <WifiOff className="h-4 w-4 mr-2" />
                  Stop Initialize
                </Button>
              </div>
            )}

            {stats.status === "QR_READY" && (
              <Button onClick={stopInitialize} disabled={loading} variant="outline" className="w-full">
                <WifiOff className="h-4 w-4 mr-2" />
                Stop Initialize
              </Button>
            )}

            {stats.status === "ERROR" && (
              <div className="text-center space-y-4">
                <div className="text-red-500">
                  <AlertCircle className="h-8 w-8 mx-auto" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-600">Koneksi Gagal</p>
                  <p className="text-xs text-muted-foreground">{stats.error || 'Unknown error'}</p>
                </div>
                <Button onClick={initializeWhatsApp} disabled={loading} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Coba Lagi
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Message */}
        <Card>
          <CardHeader>
            <CardTitle>Test Kirim Pesan</CardTitle>
            <CardDescription>
              Kirim pesan test untuk memverifikasi koneksi WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="receiver">Nomor Tujuan (tanpa +)</Label>
              <Input
                id="receiver"
                placeholder="62812345678"
                value={testMessage.receiver}
                onChange={(e) => setTestMessage({ ...testMessage, receiver: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="message">Pesan</Label>
              <Textarea
                id="message"
                placeholder="Masukkan pesan test..."
                value={testMessage.message}
                onChange={(e) => setTestMessage({ ...testMessage, message: e.target.value })}
              />
            </div>
            <Button 
              onClick={sendTestMessage} 
              disabled={loading || stats.status !== "CONNECTED" || !testMessage.receiver || !testMessage.message}
              className="w-full"
            >
              Kirim Test Message
            </Button>
          </CardContent>
        </Card>

        {/* Authorized Users Management */}
        <Card>
          <CardHeader>
            <CardTitle>Kelola User Terotorisasi</CardTitle>
            <CardDescription>
              Tambahkan nomor yang diizinkan menggunakan chatbot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="newNumber">Nomor Telepon (tanpa +)</Label>
              <Input
                id="newNumber"
                placeholder="62812345678"
                value={newAuthorizedNumber}
                onChange={(e) => setNewAuthorizedNumber(e.target.value)}
              />
            </div>
            <Button 
              onClick={addAuthorizedUser} 
              disabled={loading || !newAuthorizedNumber}
              className="w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              Tambah User
            </Button>
            <p className="text-xs text-muted-foreground">
              Jika tidak ada user terotorisasi, semua nomor dapat menggunakan bot
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}