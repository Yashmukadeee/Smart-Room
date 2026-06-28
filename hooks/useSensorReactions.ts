import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SpidermanMood } from './useLifeSimulation';

export interface SensorContext {
  lightsOn: boolean;
  fanOn: boolean;
  tempC: number | null;
  humidity: number | null;
  doorOpen: boolean;
  sensorMoodOverride: SpidermanMood | null;
  sensorTaskOverride: string | null;
}

export function useSensorReactions(): SensorContext {
  const [lightsOn, setLightsOn] = useState<boolean>(true);
  const [fanOn, setFanOn] = useState<boolean>(false);
  const [tempC, setTempC] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [doorOpen, setDoorOpen] = useState<boolean>(false);

  useEffect(() => {
    // 1. Fetch initial states
    const fetchInitialStates = async () => {
      try {
        const { data: devices, error: devError } = await supabase
          .from('devices')
          .select('id, status');

        if (devError) throw devError;

        if (devices) {
          const mainLight = devices.find(d => d.id === 'esp32_relay_1');
          const fan = devices.find(d => d.id === 'esp32_relay_4');
          const door = devices.find(d => d.id === 'esp32_door_sensor');

          if (mainLight) setLightsOn(mainLight.status);
          if (fan) setFanOn(fan.status);
          if (door) setDoorOpen(door.status);
        }

        // Fetch latest temperature log
        const { data: logs, error: logError } = await supabase
          .from('sensor_log')
          .select('temp_c, humidity')
          .order('recorded_at', { ascending: false })
          .limit(1);

        if (logError) throw logError;

        if (logs && logs.length > 0) {
          setTempC(Number(logs[0].temp_c));
          setHumidity(Number(logs[0].humidity));
        }
      } catch (err) {
        console.error('Error fetching initial sensor states:', err);
      }
    };

    fetchInitialStates();

    // 2. Realtime subscription to 'devices' changes
    const devicesChannel = supabase
      .channel('devices-sensors-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        (payload) => {
          const updatedDevice = payload.new as { id: string; status: boolean } | null;
          if (!updatedDevice) return;

          console.log('Realtime Device Update:', updatedDevice);
          if (updatedDevice.id === 'esp32_relay_1') {
            setLightsOn(updatedDevice.status);
          } else if (updatedDevice.id === 'esp32_relay_4') {
            setFanOn(updatedDevice.status);
          } else if (updatedDevice.id === 'esp32_door_sensor') {
            setDoorOpen(updatedDevice.status);
          }
        }
      )
      .subscribe();

    // 3. Realtime subscription to new 'sensor_log' entries
    const sensorsChannel = supabase
      .channel('sensor-log-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_log' },
        (payload) => {
          const newLog = payload.new as { temp_c: number; humidity: number } | null;
          if (!newLog) return;

          console.log('Realtime Sensor Log Update:', newLog);
          setTempC(Number(newLog.temp_c));
          setHumidity(Number(newLog.humidity));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(devicesChannel);
      supabase.removeChannel(sensorsChannel);
    };
  }, []);

  // Priority logic for mood and task overrides
  let sensorMoodOverride: SpidermanMood | null = null;
  let sensorTaskOverride: string | null = null;

  if (doorOpen) {
    sensorMoodOverride = 'alert';
    sensorTaskOverride = 'INTRUDER ALERT — Scanning doorway...';
  }

  return {
    lightsOn,
    fanOn,
    tempC,
    humidity,
    doorOpen,
    sensorMoodOverride,
    sensorTaskOverride,
  };
}
