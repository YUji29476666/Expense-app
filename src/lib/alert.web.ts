import type { AlertButton, AlertOptions } from 'react-native';

// react-native-web ships Alert.alert as a no-op, which would silently skip
// every confirmation (delete, rate fallback, ...). This keeps the same call
// signature and maps it onto the browser's alert/confirm dialogs.
function alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions): void {
  const text = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  const cancelButton = buttons.find((button) => button.style === 'cancel');
  const actionButtons = buttons.filter((button) => button !== cancelButton);
  // Native alerts here have one action besides Cancel; the last one is the
  // primary choice, matching how native lays them out.
  const confirmButton = actionButtons[actionButtons.length - 1];

  if (window.confirm(text)) {
    confirmButton?.onPress?.();
    return;
  }
  if (cancelButton?.onPress) {
    cancelButton.onPress();
  } else {
    options?.onDismiss?.();
  }
}

export const Alert = { alert };
