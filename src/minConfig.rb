require 'ceaser-easing'
require "fileutils"

Encoding.default_external = "UTF-8"

http_path = "/"
css_dir = "../dist/min"
sass_dir = ""
images_dir = "images"
javascripts_dir = "js"

output_style = :compressed

line_comments = false


on_stylesheet_saved do |file|
    if File.exists?(file)
        filename = File.basename(file, File.extname(file))
        File.rename(file, css_dir + "/" + filename + ".min" + File.extname(file))
    end
end