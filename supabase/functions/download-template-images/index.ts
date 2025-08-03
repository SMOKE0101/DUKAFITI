import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting template image download process...')

    // Get all templates with image URLs
    const { data: templates, error: fetchError } = await supabase
      .from('duka_products_templates')
      .select('id, name, image_url')
      .not('image_url', 'is', null)

    if (fetchError) {
      console.error('Error fetching templates:', fetchError)
      throw fetchError
    }

    console.log(`Found ${templates?.length || 0} templates with images`)

    let successCount = 0
    let errorCount = 0
    const results = []

    for (const template of templates || []) {
      try {
        console.log(`Processing template ${template.id}: ${template.name}`)
        
        // Download the image
        const response = await fetch(template.image_url)
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
        }

        const imageBlob = await response.blob()
        const arrayBuffer = await imageBlob.arrayBuffer()
        
        // Generate filename
        const fileExtension = template.image_url.includes('.png') ? 'png' : 'jpg'
        const fileName = `template-${template.id}-${Date.now()}.${fileExtension}`
        const filePath = `templates/${fileName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, arrayBuffer, {
            contentType: `image/${fileExtension}`,
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error(`Upload error for template ${template.id}:`, uploadError)
          throw uploadError
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(uploadData.path)

        // Update template record
        const { error: updateError } = await supabase
          .from('duka_products_templates')
          .update({ image_url: publicUrl })
          .eq('id', template.id)

        if (updateError) {
          console.error(`Update error for template ${template.id}:`, updateError)
          throw updateError
        }

        console.log(`✅ Successfully processed template ${template.id}`)
        successCount++
        results.push({
          id: template.id,
          name: template.name,
          status: 'success',
          newUrl: publicUrl
        })

      } catch (error) {
        console.error(`❌ Error processing template ${template.id}:`, error)
        errorCount++
        results.push({
          id: template.id,
          name: template.name,
          status: 'error',
          error: error.message
        })
      }
    }

    console.log(`Download complete: ${successCount} success, ${errorCount} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Downloaded ${successCount} images successfully`,
        successCount,
        errorCount,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in download process:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})