import TextField from "@mui/material/TextField";

/**
 * <<< Template >>>
 * This Text Field listen to enter key and pass the information to onBlur
 * @param props
 * @returns {JSX.Element}
 */

export function LazyTextField(props) {
    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            props.onBlur(e);
        }
    }

    return (
        <TextField
            {...props}
            onKeyDown={onKeyDown}
        />
    );
}