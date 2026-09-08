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
    onPickPhoto: (event: { nativeEvent: { assetId: string; selectionId: string } }) => void;
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
          attachmentId = await props.onPickMedia(nativeEvent.assetId);
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
    />
  );
}
