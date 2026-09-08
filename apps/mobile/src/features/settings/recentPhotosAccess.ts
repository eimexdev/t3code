import {
  getMediaLibraryPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
} from "expo-image-picker";

/** Called only when the user enables the shortcut in Settings. */
export async function requestRecentPhotosAccess() {
  const access = await getMediaLibraryPermissionsAsync();
  return !access.granted && access.canAskAgain ? requestMediaLibraryPermissionsAsync() : access;
}
