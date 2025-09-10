import { useState, useEffect, useCallback, useRef } from "react";
import { WebContainer } from "@webcontainer/api";
import { TemplateFolder } from "@/features/playground/types";

interface UseWebContainerProps {
  templateData: TemplateFolder | null;
}

interface UseWebContainerReturn {
  serverUrl: string | null;
  isLoading: boolean;
  error: string | null;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  destroy: () => Promise<void>;
}

export const useWebcontainer = ({
  templateData,
}: UseWebContainerProps): UseWebContainerReturn => {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [instance, setInstance] = useState<WebContainer | null>(null);

  const instanceRef = useRef<WebContainer | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeWebcontainer() {
      try {
        if (instanceRef.current) return;

        const webContainerInstance = await WebContainer.boot();
        instanceRef.current = webContainerInstance;

        if (!mounted) {
          return;
        }

        setInstance(webContainerInstance);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize webcontainer: ", err);
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to initialize webcontainer"
          );
          setIsLoading(false);
        }
      }
    }

    initializeWebcontainer();

    return () => {
      mounted = false;
      if (instanceRef.current) {
        instanceRef.current.teardown();
        instanceRef.current = null;
      }
    };
  }, []);

  const writeFileSync = useCallback(
    async (path: string, content: string): Promise<void> => {
      if (!instance) throw new Error("WebContainer instance not initialized");

      try {
        const pathParts = path.split("/");
        const folderPath = pathParts.slice(0, pathParts.length - 1).join("/");

        if (folderPath) {
          await instance.fs.mkdir(folderPath, { recursive: true });
        }
        await instance.fs.writeFile(path, content);
      } catch (err) {
        console.error("Failed to write file at : ", path, "\n", err);
        throw new Error(`Failed to write file at : ${path} : ${err}`);
      }
    },
    [instance]
  );

  const destroy = useCallback(async () => {
    if (instance) {
      instance.teardown();
      setInstance(null);
      setServerUrl(null);
    }
  }, [instance]);

  return {
    serverUrl,
    isLoading,
    error,
    instance,
    writeFileSync,
    destroy,
  };
};
