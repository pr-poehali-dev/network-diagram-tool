import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface NetworkDevice {
  id: string;
  type: string;
  name: string;
  icon: string;
  color: string;
}

interface PlacedDevice extends NetworkDevice {
  x: number;
  y: number;
}

const deviceLibrary: NetworkDevice[] = [
  { id: 'router', type: 'Маршрутизатор', name: 'Router', icon: 'Router', color: '#0EA5E9' },
  { id: 'switch', type: 'Коммутатор', name: 'Switch', icon: 'Network', color: '#8B5CF6' },
  { id: 'server', type: 'Сервер', name: 'Server', icon: 'Server', color: '#F97316' },
  { id: 'pc', type: 'Компьютер', name: 'PC', icon: 'Monitor', color: '#0EA5E9' },
  { id: 'laptop', type: 'Ноутбук', name: 'Laptop', icon: 'Laptop', color: '#8B5CF6' },
  { id: 'firewall', type: 'Файрвол', name: 'Firewall', icon: 'Shield', color: '#F97316' },
  { id: 'cloud', type: 'Облако', name: 'Cloud', icon: 'Cloud', color: '#0EA5E9' },
  { id: 'database', type: 'База данных', name: 'Database', icon: 'Database', color: '#8B5CF6' },
];

const Index = () => {
  const [placedDevices, setPlacedDevices] = useState<PlacedDevice[]>([]);
  const [draggedDevice, setDraggedDevice] = useState<NetworkDevice | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDragStart = (device: NetworkDevice) => {
    setDraggedDevice(device);
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedDevice || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newDevice: PlacedDevice = {
      ...draggedDevice,
      id: `${draggedDevice.id}-${Date.now()}`,
      x: Math.round(x / 20) * 20,
      y: Math.round(y / 20) * 20,
    };

    setPlacedDevices([...placedDevices, newDevice]);
    setDraggedDevice(null);
    setIsDragging(false);

    toast({
      title: 'Устройство добавлено',
      description: `${draggedDevice.type} размещён на схеме`,
    });
  };

  const removeDevice = (id: string) => {
    setPlacedDevices(placedDevices.filter(d => d.id !== id));
    toast({
      title: 'Устройство удалено',
      description: 'Объект удалён со схемы',
    });
  };

  const exportToJSON = () => {
    const schema = {
      version: '1.0',
      created: new Date().toISOString(),
      devices: placedDevices.map(d => ({
        id: d.id,
        type: d.type,
        name: d.name,
        position: { x: d.x, y: d.y },
        color: d.color,
      })),
    };

    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-schema-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Схема экспортирована',
      description: 'JSON файл успешно сохранён',
    });
  };

  const clearCanvas = () => {
    setPlacedDevices([]);
    toast({
      title: 'Схема очищена',
      description: 'Все объекты удалены',
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
        <div className="flex items-center gap-3">
          <Icon name="Network" size={28} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Network Designer</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={clearCanvas}
            className="hover:bg-muted transition-colors"
          >
            <Icon name="Trash2" size={18} className="mr-2" />
            Очистить
          </Button>
          <Button
            onClick={exportToJSON}
            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
          >
            <Icon name="Download" size={18} className="mr-2" />
            Экспорт JSON
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-border bg-card">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Icon name="Box" size={20} />
              Библиотека
            </h2>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="p-4 space-y-2">
              {deviceLibrary.map((device) => (
                <Card
                  key={device.id}
                  draggable
                  onDragStart={() => handleDragStart(device)}
                  className="p-4 cursor-move hover:bg-muted transition-all hover:scale-105 border-border"
                  style={{ borderLeftColor: device.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${device.color}20` }}
                    >
                      <Icon name={device.icon as any} size={24} style={{ color: device.color }} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{device.type}</p>
                      <p className="text-xs text-muted-foreground">{device.name}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="w-full h-full grid-pattern relative"
          >
            {placedDevices.map((device) => (
              <div
                key={device.id}
                className="absolute group animate-scale-in"
                style={{ left: device.x, top: device.y }}
              >
                <div
                  className="w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 border-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  style={{
                    backgroundColor: `${device.color}30`,
                    borderColor: device.color,
                  }}
                >
                  <Icon name={device.icon as any} size={32} style={{ color: device.color }} />
                  <span className="text-xs font-medium text-foreground">{device.name}</span>
                  <button
                    onClick={() => removeDevice(device.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:scale-110"
                  >
                    <Icon name="X" size={14} />
                  </button>
                </div>
              </div>
            ))}

            {placedDevices.length === 0 && !isDragging && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center animate-fade-in">
                  <Icon name="MousePointerClick" size={64} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-xl text-muted-foreground">
                    Перетащите устройства из библиотеки
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Создайте схему вашей сети
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="w-72 border-l border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Icon name="List" size={20} />
              Объекты на схеме
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Всего: {placedDevices.length}
            </p>
          </div>
          <ScrollArea className="flex-1">
            {placedDevices.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="FileX" size={48} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  Нет размещённых объектов
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {placedDevices.map((device) => (
                  <Card
                    key={device.id}
                    className="p-3 border-border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${device.color}30` }}
                        >
                          <Icon name={device.icon as any} size={18} style={{ color: device.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{device.type}</p>
                          <p className="text-xs text-muted-foreground">
                            x: {device.x}, y: {device.y}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDevice(device.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
};

export default Index;
