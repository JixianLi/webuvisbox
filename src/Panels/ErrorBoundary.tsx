// ABOUTME: Catches an error thrown while rendering below it and shows a fallback in its place, so one failing panel (or
// ABOUTME: the grid) does not blank the app. A new resetKey (the next scenario swapped in) clears the error.

import { Component, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { SHAPE } from "../Theme/DesignTokens";

interface ErrorBoundaryProps {
    resetKey: unknown;
    fallback: (error: Error) => ReactNode;
    children?: ReactNode;
}

interface ErrorBoundaryState {
    error: Error | null;
    resetKey: unknown;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: null, resetKey: this.props.resetKey };

    static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
        return { error: error instanceof Error ? error : new Error(String(error)) };
    }

    static getDerivedStateFromProps(props: ErrorBoundaryProps, state: ErrorBoundaryState): Partial<ErrorBoundaryState> | null {
        return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
    }

    render() {
        return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
    }
}

export function ErrorFallback({ title, error }: { title: string; error: Error }) {
    const tokens = useTheme().tokens;
    return (
        <Box role="alert" sx={{ height: '100%', boxSizing: 'border-box', overflow: 'auto', p: tokens.px(12) + 'px',
                                 border: `1px solid ${tokens.border}`, borderRadius: tokens.px(SHAPE.panelRadius) + 'px',
                                 backgroundColor: tokens.surface }}>
            <Typography variant="subtitle2" sx={{ color: tokens.text }}>{title}</Typography>
            <Typography variant="body2" sx={{ color: tokens.textSecondary, mt: 0.5, wordBreak: 'break-word' }}>
                {error.message}
            </Typography>
        </Box>
    );
}

export default ErrorBoundary;
