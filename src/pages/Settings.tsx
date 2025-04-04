
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { extendedSupabase } from "@/integrations/supabase/client-extension";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { ProfileSection } from "@/components/settings/ProfileSection";

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("company-details");
  const [activeSettingsTab, setActiveSettingsTab] = useState("profile-details");

  const { data: companyData, isLoading: isCompanyLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await extendedSupabase
        .from('companies')
        .select('*')
        .limit(1)
        .single();
        
      if (error) {
        toast({
          title: "Error loading company data",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }
      
      return data;
    }
  });

  const { data: profileData } = useQuery({
    queryKey: ['profile-settings'],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await extendedSupabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        toast({
          title: "Error loading profile data",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  const { data: questionsData } = useQuery({
    queryKey: ['business-questions'],
    queryFn: async () => {
      if (!companyData?.id) return null;

      const { data, error } = await extendedSupabase
        .from('business_questions')
        .select('*')
        .eq('company_id', companyData.id)
        .maybeSingle();
        
      if (error) {
        toast({
          title: "Error loading additional questions",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }
      
      return data;
    },
    enabled: !!companyData?.id
  });

  const { data: socialMediaData } = useQuery({
    queryKey: ['social-media'],
    queryFn: async () => {
      if (!companyData?.id) return null;

      const { data, error } = await extendedSupabase
        .from('social_media')
        .select('*')
        .eq('company_id', companyData.id)
        .maybeSingle();
        
      if (error) {
        toast({
          title: "Error loading social media data",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }
      
      return data;
    },
    enabled: !!companyData?.id
  });

  const { data: appUsersData } = useQuery({
    queryKey: ['app-users'],
    queryFn: async () => {
      if (!companyData?.id) return [];

      const { data, error } = await extendedSupabase
        .from('app_users')
        .select(`
          id,
          user_type,
          status,
          role,
          user_id,
          profiles:user_id (
            full_name,
            last_name,
            email:id (
              email
            )
          )
        `)
        .eq('company_id', companyData.id);
        
      if (error) {
        toast({
          title: "Error loading users data",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data.map(user => ({
        id: user.id,
        user: user.profiles?.full_name || 'Unknown',
        user_type: user.user_type,
        status: user.status,
        role: user.role,
        email: user.profiles?.email?.email || 'N/A',
      }));
    },
    enabled: !!companyData?.id
  });

  return (
    <SettingsLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Tabs 
        value={activeSettingsTab} 
        onValueChange={setActiveSettingsTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="profile-details">Profile Details</TabsTrigger>
          <TabsTrigger value="company-info">Company Info</TabsTrigger>
          <TabsTrigger value="additional-questions">Additional Questions</TabsTrigger>
          <TabsTrigger value="social-media">Social Media</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="profile-details">
          <ProfileSection profileData={profileData} />
        </TabsContent>

        <TabsContent value="company-info">
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Company settings content will be here.</p>
          </div>
        </TabsContent>

        <TabsContent value="additional-questions">
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Additional questions content will be here.</p>
          </div>
        </TabsContent>

        <TabsContent value="social-media">
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Social media settings content will be here.</p>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="p-8 text-center">
            <p className="text-muted-foreground">User management content will be here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </SettingsLayout>
  );
}
