import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import {
  getMediaLibraryPermissionsAsync,
  type MediaLibraryPermissionResponse,
} from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Linking } from "react-native";
import { mobilePreferencesAtom, updateMobilePreferencesAtom } from "../../state/preferences";
import { requestRecentPhotosAccess } from "./recentPhotosAccess";
import { SettingsSection } from "./components/SettingsSection";
import { SettingsSwitchRow } from "./components/SettingsSwitchRow";
import { SettingsRow } from "./components/SettingsRow";

export function RecentPhotosSettingsSection() {
  const preferences = useAtomValue(mobilePreferencesAtom);
  const savePreferences = useAtomSet(updateMobilePreferencesAtom);
  const [permission, setPermission] = useState<MediaLibraryPermissionResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const ready = AsyncResult.isSuccess(preferences);
  const enabled = ready && preferences.value.recentPhotosEnabled === true;

  const refresh = useCallback(async () => {
    try {
      const access = await getMediaLibraryPermissionsAsync();
      setPermission(access);
      if (!access.granted) savePreferences({ recentPhotosEnabled: false });
    } catch {
      setPermission(null);
    }
  }, [savePreferences]);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && !inFlight.current) void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const toggle = async (value: boolean) => {
    if (!ready || inFlight.current) return;
    if (!value) {
      savePreferences({ recentPhotosEnabled: false });
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      const access = await requestRecentPhotosAccess();
      setPermission(access);
      savePreferences({ recentPhotosEnabled: access.granted });
    } catch {
      Alert.alert("Couldn't check photo access", "Try again in a moment.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const blocked = permission !== null && !permission.granted && !permission.canAskAgain;
  return (
    <SettingsSection title="Attachments">
      <SettingsSwitchRow
        icon="photo"
        label="Recent photos"
        subtitle={
          blocked
            ? "Photo access is disabled. Allow access in iOS Settings to enable this shortcut."
            : permission?.accessPrivileges === "limited"
              ? "Hold the attachment button to pick from photos you've allowed."
              : "Hold the attachment button to pick a recent photo. Requires photo-library access."
        }
        value={enabled && permission?.granted === true}
        disabled={!ready || busy || permission === null || blocked}
        onValueChange={(value) => void toggle(value)}
      />
      {blocked ? (
        <SettingsRow
          icon="gearshape"
          label="Open iOS Settings"
          onPress={() =>
            void Linking.openSettings().catch(() =>
              Alert.alert(
                "Couldn't open Settings",
                "Open iOS Settings, select T3 Code, then allow Photos access.",
              ),
            )
          }
        />
      ) : null}
      {permission === null ? (
        <SettingsRow
          icon="arrow.clockwise"
          label="Check photo access"
          onPress={() => void refresh()}
        />
      ) : null}
    </SettingsSection>
  );
}
