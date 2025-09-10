"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import TemplateFileTree from "@/features/playground/components/template-file-tree";
import { useFileExplorer } from "@/features/playground/hooks/use-file-explorer";
import usePlayground from "@/features/playground/hooks/use-playground";
import { useParams } from "next/navigation";
import {
  FileText,
  FolderOpen,
  AlertCircle,
  Save,
  X,
  Settings,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useCallback, useEffect, useRef, useState } from "react";
import { TemplateFile, TemplateFolder } from "@/features/playground/types";
import PlaygroundEditor from "@/features/playground/components/playground-editor";
import { useWebcontainer } from "@/features/webContainers/hooks/use-webcontainer";
import WebConteinerPreview from "@/features/webContainers/components/webcontainer-preview";
import LoadingStep from "@/components/ui/loader";
import { findFilePath } from "@/features/playground/libs";
import { toast } from "sonner";
import ToggleAI from "@/features/playground/components/toggle-ai";
import { useAISuggestion } from "@/features/ai/hooks/use-ai-suggestion";

const Playground = () => {
  const { id } = useParams<{ id: string }>();
  const {
    playgroundData,
    templateData,
    isLoading,
    error,
    loadPlayground,
    saveTemplateData,
  } = usePlayground(id);

  const aiSuggestion = useAISuggestion();

  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

  const {
    activeFileId,
    closeAllFiles,
    openFile,
    closeFile,
    editorContent,
    updateFileContent,
    handleAddFile,
    handleAddFolder,
    handleDeleteFile,
    handleDeleteFolder,
    handleRenameFile,
    handleRenameFolder,
    openFiles,
    setTemplateData,
    setActiveFileId,
    setPlaygroundId,
    setOpenFiles,
  } = useFileExplorer();

  const {
    serverUrl,
    isLoading: containerLoading,
    error: containerError,
    instance,
    writeFileSync,
    destroy,
  } = useWebcontainer({ templateData });

  const lastSyncedContent = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    return () => {
      closeAllFiles();
    };
  }, []);

  useEffect(() => {
    setPlaygroundId(id);
  }, [id, setPlaygroundId]);

  useEffect(() => {
    if (templateData && !openFiles.length) {
      setTemplateData(templateData);
    }
  }, [templateData, setTemplateData, openFiles.length]);

  const wrappedHandleAddFile = useCallback((newFile: TemplateFile, parentPath: string) => {
    return handleAddFile(newFile, parentPath, writeFileSync, instance, saveTemplateData);
  }, [handleAddFile, writeFileSync, instance, saveTemplateData]);

  const wrappedHandleAddFolder = useCallback(
    (newFolder: TemplateFolder, parentPath: string) => {
      return handleAddFolder(newFolder, parentPath, instance, saveTemplateData);
    },
    [handleAddFolder, instance, saveTemplateData]
  );

  const wrappedHandleDeleteFile = useCallback(
    (file: TemplateFile, parentPath: string) => {
      return handleDeleteFile(file, parentPath, saveTemplateData);
    },
    [handleDeleteFile, saveTemplateData]
  );

  const wrappedHandleDeleteFolder = useCallback(
    (folder: TemplateFolder, parentPath: string) => {
      return handleDeleteFolder(folder, parentPath, saveTemplateData);
    },
    [handleDeleteFolder, saveTemplateData]
  );

  const wrappedHandleRenameFile = useCallback(
    (
      file: TemplateFile,
      newFilename: string,
      newExtension: string,
      parentPath: string
    ) => {
      return handleRenameFile(
        file,
        newFilename,
        newExtension,
        parentPath,
        saveTemplateData
      );
    },
    [handleRenameFile, saveTemplateData]
  );

  const wrappedHandleRenameFolder = useCallback(
    (folder: TemplateFolder, newFolderName: string, parentPath: string) => {
      return handleRenameFolder(
        folder,
        newFolderName,
        parentPath,
        saveTemplateData
      );
    },
    [handleRenameFolder, saveTemplateData]
  );

  const activeFile = openFiles.find((file) => file.id === activeFileId);
  const hasUnsavedChanges = openFiles.some((file) => file.hasUnsavedChanges);

  const handleFileSelect = (file: TemplateFile) => {
    openFile(file);
  };

  const handleSave = useCallback(
    async (fileId?: string) => {
      const targetFileId = fileId || activeFileId;

      if(!targetFileId) return;

      const fileToSave = openFiles.find((file) => file.id === targetFileId)!;
      if(!fileToSave) return;

      const latestTemplateData = useFileExplorer.getState().templateData;
      if(!latestTemplateData) return;

      try {
        const filePath = findFilePath(fileToSave, latestTemplateData);
        if(!filePath) {
          toast.error(`
            Could not find path for file: ${fileToSave.filename}.${fileToSave.fileExtension}`
          );
          return;
        }

        const updatedTemplateData = JSON.parse(JSON.stringify(latestTemplateData));

        const updateFileContent = (items: any[]): any[] => {
          return items.map((item) => {
            if("folderName" in item) {
              return {
                ...item,
                items: updateFileContent(item.items),
              }
            } else if(item.filename === fileToSave.filename && item.fileExtension === fileToSave.fileExtension) {
              return {
                ...item,
                content: fileToSave.content
              }
            }
            return item;
          });
        };

        updatedTemplateData.items = updateFileContent(updatedTemplateData.items);

        if(writeFileSync) {
          await writeFileSync(filePath, fileToSave.content);
          lastSyncedContent.current.set(fileToSave.id, fileToSave.content);

          if(instance && instance.fs) {
            await instance.fs.writeFile(filePath, fileToSave.content);
          }
        }

        const newTemplateData = await saveTemplateData(updatedTemplateData);
        setTemplateData(newTemplateData! || updatedTemplateData);

        const updatedOpenFiles = openFiles.map((file) => 
          file.id === targetFileId ? {
            ...file,
            content: fileToSave.content,
            originalContent: fileToSave.content,
            hasUnsavedChanges: false,
          } : file
        );

        setOpenFiles(updatedOpenFiles);
      } catch (error) {
        console.error("Error saving file:", error);
        toast.error(`Failed to save file: ${fileToSave.filename}.${fileToSave.fileExtension}`);
        throw error;
      }
  }, [
    activeFileId,
    openFiles,
    instance,
    saveTemplateData,
    setTemplateData,
    setOpenFiles,
  ]);

  const handleSaveAll = async() => {
    const unsavedFiles = openFiles.filter((f) => f.hasUnsavedChanges);

    if(unsavedFiles.length === 0) {
      toast.info("No unsaved changes found.");
      return;
    }

    try {
      await Promise.all(unsavedFiles.map((file) => handleSave(file.id)));
      toast.success(`Saved ${unsavedFiles.length} file(s)`);
    } catch (error) {
      toast.error("Failed to save files");
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if(event.ctrlKey && event.key === "s") {
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleSave]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="destructive">
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-md p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-6 text-center">
            Loading Playground
          </h2>
          <div className="mb-8">
            <LoadingStep
              currentStep={1}
              step={1}
              label="Loading playground data"
            />
            <LoadingStep
              currentStep={2}
              step={2}
              label="Setting up environment"
            />
            <LoadingStep currentStep={3} step={3} label="Ready to code" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <>
        <TemplateFileTree
          data={templateData!}
          onFileSelect={handleFileSelect}
          selectedFile={activeFile}
          title="File Explorer"
          onAddFile={wrappedHandleAddFile}
          onAddFolder={wrappedHandleAddFolder}
          onDeleteFile={wrappedHandleDeleteFile}
          onDeleteFolder={wrappedHandleDeleteFolder}
          onRenameFile={wrappedHandleRenameFile}
          onRenameFolder={wrappedHandleRenameFolder}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mt-2 h-4" />
            <div className="flex flex-1 items-center gap-2">
              <div className="flex flex-col flex-1">
                <h1 className="text-sm font-medium">
                  {playgroundData?.title || "Untitled Project"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {openFiles.length} File(s) open
                  {hasUnsavedChanges && " 📝 Unsaved changes"}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSave()}
                      disabled={!activeFile || !activeFile.hasUnsavedChanges}
                    >
                      <Save className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save (Ctrl + S)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size={"sm"}
                      variant={"outline"}
                      onClick={handleSaveAll}
                      disabled={!hasUnsavedChanges}
                    >
                      <Save className="h-4 w-4" /> All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save All (Ctrl+Shift+S)</TooltipContent>
                </Tooltip>

                <ToggleAI 
                  isEnabled={aiSuggestion.isEnabled}
                  onToggle={aiSuggestion.toggleEnabled}
                  suggestionLoading={aiSuggestion.isLoading}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size={"sm"} variant={"outline"}>
                      <Settings className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                    >
                      {isPreviewVisible ? "Hide" : "Show"} Preview
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={closeAllFiles}>
                      Close All Files
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <div className="h-[calc(100vh-4rem)]">
            <div className="h-full flex flex-col">
              <div className="border-b bg-muted/30">
                {openFiles.length !== 0 && (
                  <Tabs
                    value={activeFileId || ""}
                    onValueChange={setActiveFileId}
                  >
                    <div className="flex items-center justify-between px-4 py-2">
                      <TabsList
                        className="h-8 bg-transparent p-0 "
                        style={{
                          scrollbarGutter: "stable",
                        }}
                      >
                        {openFiles.map((file) => (
                          <TabsTrigger
                            key={file.id}
                            value={file.id}
                            className="relative h-8 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm group"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="size-3" />
                              <span>
                                {file.filename}.{file.fileExtension}
                              </span>
                              {file.hasUnsavedChanges && (
                                <span className="h-2 w-2 rounded-full bg-orange-500" />
                              )}
                              <span
                                className="ml-2 h-4 w-4 hover:bg-destructive hover:text-destructive-foreground rounded-sm flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  closeFile(file.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </span>
                            </div>
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {openFiles.length > 1 && (
                        <Button
                          size={"sm"}
                          variant={"ghost"}
                          onClick={closeAllFiles}
                          className="h-6 px-2 text-xs"
                        >
                          Close All
                        </Button>
                      )}
                    </div>
                  </Tabs>
                )}
              </div>
              <div className="flex-1">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                  <ResizablePanel defaultSize={isPreviewVisible ? 50 : 100}>
                    {openFiles.length !== 0 ? (
                      <PlaygroundEditor
                        activeFile={activeFile}
                        content={activeFile?.content || ""}
                        onContentChange={(value) =>
                          activeFileId && updateFileContent(activeFileId, value)
                        }
                        suggestion={aiSuggestion.suggestion}
                        suggestionLoading={aiSuggestion.isLoading}
                        suggestionPosition={aiSuggestion.position}
                        onAcceptSuggestion={(editor, monaco) => aiSuggestion.acceptSuggestion(editor, monaco)}
                        onRejectSuggestion={(editor) => aiSuggestion.rejectSuggestion(editor)}
                        onTriggerSuggestion={(type, editor) => aiSuggestion.fetchSuggestion(type, editor)}
                      />
                    ) : (
                      <div className="flex flex-col h-full items-center justify-center text-muted-foreground gap-4">
                        <FileText className="size-16 text-gray-300" />
                        <div className="text-center">
                          <p className="text-lg font-medium">No Files Open</p>
                          <p className="text-sm text-gray-500">
                            Select a file from the sidebar to start coding
                          </p>
                        </div>
                      </div>
                    )}
                  </ResizablePanel>

                  <>
                    <ResizableHandle />
                    <ResizablePanel
                      defaultSize={50}
                      collapsedSize={0}
                      className={isPreviewVisible ? "block" : "hidden"}
                    >
                      <WebConteinerPreview
                        templateData={templateData!}
                        instance={instance}
                        writeFileSync={writeFileSync}
                        isLoading={containerLoading}
                        error={containerError}
                        serverUrl={serverUrl!}
                        forceResetup={false}
                      />
                    </ResizablePanel>
                  </>
                </ResizablePanelGroup>
              </div>
            </div>
          </div>
        </SidebarInset>
      </>
    </TooltipProvider>
  );
};

export default Playground;
