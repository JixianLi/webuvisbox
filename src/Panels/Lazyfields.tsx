import type { FocusEvent, KeyboardEvent } from "react";
import TextField, { type TextFieldProps } from "@mui/material/TextField";

export type LazyTextFieldProps = TextFieldProps & {
    // Whether the typed text may be committed. Rejected text is replaced by defaultValue and onBlur is not called.
    validate?: (text: string) => boolean;
};

/**
 * <<< Template >>>
 * A text field that commits when the user presses Enter or leaves it, not on every keystroke: give it defaultValue
 * (and a key that changes with the value, so a change made elsewhere shows) and commit in onBlur. Enter blurs the
 * field, which commits through onBlur; in a multiline field Enter stays a newline.
 */
export function LazyTextField({ validate, onBlur, onKeyDown, defaultValue, ...props }: LazyTextFieldProps) {
    const handleBlur = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (validate && !validate(event.target.value)) {
            event.target.value = defaultValue == null ? "" : String(defaultValue);
            return;
        }
        onBlur?.(event);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.key === "Enter" && !props.multiline && event.target instanceof HTMLElement) {
            event.target.blur();
        }
    };

    return <TextField {...props} defaultValue={defaultValue} onBlur={handleBlur} onKeyDown={handleKeyDown} />;
}
