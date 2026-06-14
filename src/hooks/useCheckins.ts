'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

export interface Checkin {
  id: string;
  locationId: string;
  content: string | null;
  photos: string[];
  createdAt: string;
  checkType: 'real' | 'virtual';
}

export function useCheckins() {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCheckins([]);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id);

      if (data) {
        setCheckins(
          data.map((c) => ({
            id: c.id,
            locationId: c.place_id,
            content: c.check_note,
            photos: c.check_photos ?? [],
            createdAt: c.created_at,
            checkType: c.check_type,
          }))
        );
      }
      setLoading(false);
    };

    load();
  }, [user]);

  const hasCheckedIn = useCallback(
    (locationId: string) => checkins.some((c) => c.locationId === locationId),
    [checkins]
  );

  const addCheckin = useCallback(
    async (locationId: string, content: string, photos: string[], checkType: 'real' | 'virtual' = 'virtual') => {
      if (!user) throw new Error('Not logged in');

      const { data, error } = await supabase
        .from('checkins')
        .insert({
          user_id: user.id,
          place_id: locationId,
          check_type: checkType,
          check_note: content || null,
          check_photos: photos.length > 0 ? photos : null,
        })
        .select()
        .single();

      if (error) throw error;

      const newCheckin: Checkin = {
        id: data.id,
        locationId: data.place_id,
        content: data.check_note,
        photos: data.check_photos ?? [],
        createdAt: data.created_at,
        checkType: data.check_type,
      };

      setCheckins((prev) => [...prev, newCheckin]);
      return newCheckin;
    },
    [user]
  );

  const getCheckinsByLocation = useCallback(
    (locationId: string) => checkins.filter((c) => c.locationId === locationId),
    [checkins]
  );

  return { checkins, loading, hasCheckedIn, addCheckin, getCheckinsByLocation };
}