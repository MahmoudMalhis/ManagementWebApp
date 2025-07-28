import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { accomplishmentsAPI } from '@/api/api';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LucideUpload, LucideLoader, LucideArrowLeft } from 'lucide-react';

const AddAccomplishment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendNewAccomplishment } = useSocket();
  
  // Prevent managers from accessing this page
  useEffect(() => {
    if (user?.role === 'manager') {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('common.notAuthorized'),
      });
      navigate('/accomplishments');
    }
  }, [user, navigate, toast, t]);
  
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setError(t('accomplishments.description') + ' ' + t('common.error').toLowerCase());
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('description', description);
      
      if (files) {
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }
      }
      
      // Submit the accomplishment
      const response = await accomplishmentsAPI.createAccomplishment(formData);
      
      // Send notification via socket
      sendNewAccomplishment({
        _id: response.data._id,
        description: response.data.description,
        employee: {
          _id: user?.id,
          name: user?.name
        },
        createdAt: response.data.createdAt
      });
      
      // Show success message
      toast({
        title: t('common.success'),
        description: t('accomplishments.add') + ' ' + t('common.success').toLowerCase(),
      });
      
      // Redirect back to accomplishments list
      navigate('/accomplishments');
      
    } catch (err) {
      console.error('Error adding accomplishment:', err);
      setError(err.message || t('common.error'));
      
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: err.message || t('common.error'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button 
        variant="ghost"
        className="mb-4 flex items-center gap-1"
        onClick={() => navigate('/accomplishments')}
      >
        <LucideArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('accomplishments.add')}</CardTitle>
          <CardDescription>
            {t('accomplishments.description')}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="description">{t('accomplishments.description')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('accomplishments.description')}
                className="min-h-[100px]"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="files">{t('accomplishments.files')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="files"
                  type="file"
                  multiple
                  onChange={(e) => setFiles(e.target.files)}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {files ? `${files.length} ${t('accomplishments.files').toLowerCase()}` : t('accomplishments.uploadFiles')}
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/accomplishments')}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LucideLoader className="h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <LucideUpload className="h-4 w-4" />
                  {t('accomplishments.submit')}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AddAccomplishment;