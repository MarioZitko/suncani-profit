import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
	dark: boolean;
	onToggle: () => void;
}

export function ThemeToggle({ dark, onToggle }: ThemeToggleProps) {
	return (
		<Button variant="ghost" size="icon" onClick={onToggle}>
			{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
		</Button>
	);
}
