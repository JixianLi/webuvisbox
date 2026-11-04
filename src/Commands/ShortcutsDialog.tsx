// ABOUTME: Lists every registered command with a shortcut, grouped (Display, Panel, Layout, the scenario's own).

import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import Typography from "@mui/material/Typography";
import { useTheme, type SxProps, type Theme } from "@mui/material/styles";
import { commandRegistry, shortcutLabel } from "./CommandRegistry";

export const ShortcutsDialog = observer(() => {
    const tokens = useTheme().tokens;
    const groups = new Map<string, Array<{ label: string; shortcut: string }>>();
    for (const command of commandRegistry.commands.values()) {
        if (command.shortcut) {
            const group = groups.get(command.group) ?? [];
            group.push({ label: command.label, shortcut: shortcutLabel(command.shortcut) });
            groups.set(command.group, group);
        }
    }

    // The paper is styled through the dialog's sx: as slotProps.paper.sx, TypeScript gives up on Dialog's props (TS2590).
    const dialogSx: SxProps<Theme> = { '& .MuiDialog-paper': {
        backgroundColor: tokens.surfaceRaised, border: `1px solid ${tokens.border}`,
        borderRadius: `${tokens.px(12)}px`, p: 2.5, minWidth: tokens.px(380) } };

    return (
        <Dialog open={commandRegistry.shortcutsOpen} onClose={() => commandRegistry.setShortcutsOpen(false)}
                sx={dialogSx}>
            <Typography sx={{ fontSize: tokens.px(15), fontWeight: 600, mb: 1.5 }}>Keyboard shortcuts</Typography>
            {[...groups.entries()].map(([group, commands]) => (
                <Box key={group} sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontSize: tokens.px(11), fontWeight: 600, color: tokens.textMuted,
                                      textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>{group}</Typography>
                    {commands.map(command => (
                        <Box key={command.label} sx={{ display: 'flex', alignItems: 'center', py: 0.5, gap: 2 }}>
                            <Typography sx={{ fontSize: tokens.px(13), flexGrow: 1 }}>{command.label}</Typography>
                            <Box component="kbd" sx={{ fontFamily: 'inherit', fontSize: tokens.px(12), px: 0.75, py: 0.25,
                                                       borderRadius: `${tokens.px(5)}px`, backgroundColor: tokens.controlFill,
                                                       border: `1px solid ${tokens.border}`, color: tokens.textSecondary }}>
                                {command.shortcut}
                            </Box>
                        </Box>
                    ))}
                </Box>
            ))}
        </Dialog>
    );
});

export default ShortcutsDialog;
