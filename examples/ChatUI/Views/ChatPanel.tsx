// ABOUTME: Wires the Chat library renderer to the chatUI global context.
// ABOUTME: Submitting a prompt kicks off the fake agent path on the global context.

import { observer } from "mobx-react-lite";
import Panel from "@/Panels/Panel";
import { Chat } from "@/Renderers/Chat";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type ChatUIGlobalContext from "../ChatUIGlobalContext";

const ChatPanel = observer(() => {
    const ctx = useScenario().globalContext as ChatUIGlobalContext;
    return (
        <Panel panelName="Chat">
            <Chat
                messages={ctx.chatMessages.slice()}
                onSubmit={(text) => ctx.submitUserPrompt(text)}
                busy={ctx.busy}
            />
        </Panel>
    );
});

export default ChatPanel;
