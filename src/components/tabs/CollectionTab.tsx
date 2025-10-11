import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetsTab } from "./AssetsTab";
import { RulesTab } from "./RulesTab";
import { DistributionTab } from "./DistributionTab";

export default function CollectionTab() {
  return (
    <Tabs defaultValue="assets" className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="assets">Assets</TabsTrigger>
        <TabsTrigger value="rules">Rules</TabsTrigger>
        <TabsTrigger value="distribution">Distribution</TabsTrigger>
      </TabsList>
      
      <TabsContent value="assets" className="flex-1 mt-0">
        <AssetsTab />
      </TabsContent>
      
      <TabsContent value="rules" className="flex-1 mt-0">
        <RulesTab />
      </TabsContent>
      
      <TabsContent value="distribution" className="flex-1 mt-0">
        <DistributionTab />
      </TabsContent>
    </Tabs>
  );
}
