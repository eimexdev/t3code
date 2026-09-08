import { requireNativeModule, requireNativeView } from "expo";
import type { ComponentProps } from "react";
import { Alert, type ColorValue, type ViewProps } from "react-native";
import type { ComposerAttachmentButton as SharedAttachmentButton } from "./ComposerAttachmentButton";
import { withUniwind } from "uniwind";

const nativeControls = requireNativeModule<{
  finishRecentPhotoSelection: (selectionId: string, identifier: string) => Promise<void>;
}>("T3NativeControls");

const NativeButton = requireNativeView<
  ViewProps & {
    disabled: boolean;
    supportsFiles: boolean;
    iconColor?: ColorValue;
    onPickMedia: () => void;
    onPickFiles: () => void;
    onPickPhoto: (event: { nativeEvent: { uri: string; selectionId: string } }) => void;
    onPhotoError: () => void;
  }
>("T3NativeControls", "RecentPhotosButton");

const ThemedNativeButton = withUniwind(NativeButton, {
  iconColor: { fromClassName: "iconColorClassName", styleProperty: "accentColor" },
});

export function ComposerAttachmentButton(props: ComponentProps<typeof SharedAttachmentButton>) {
  return (
    <ThemedNativeButton
      style={{ width: 44, height: 44, flexShrink: 0 }}
      disabled={props.disabled ?? false}
      supportsFiles={props.supportsFiles}
      iconColorClassName="accent-icon"
      onPickMedia={() => void props.onPickMedia()}
      onPickFiles={() => void props.onPickFiles()}
      onPickPhoto={async ({ nativeEvent }) => {
        let attachmentId: string | undefined;
        try {
          attachmentId = await props.onPickPhoto([nativeEvent.uri]);
          if (!attachmentId) {
            Alert.alert(
              "Couldn't attach photo",
              "The photo may be too large or the message may have reached its attachment limit.",
            );
          }
        } catch {
          Alert.alert("Couldn't attach photo", "Try again or choose it from Photo Library.");
        } finally {
          requestAnimationFrame(() => {
            void nativeControls.finishRecentPhotoSelection(
              nativeEvent.selectionId,
              attachmentId ? `draft-image:${attachmentId}` : "",
            );
          });
        }
      }}
      onPhotoError={() =>
        Alert.alert("Couldn't load photo", "Try again or choose it from Photo Library.")
      }
    />
  );
}
