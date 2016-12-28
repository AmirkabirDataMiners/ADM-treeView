require 'ceaser-easing'

Encoding.default_external = "UTF-8"

http_path = "/"
css_dir = "../dist"
sass_dir = ""
images_dir = "images"
javascripts_dir = "js"

output_style = :expanded

line_comments = true

on_stylesheet_saved do
    `compass compile -c minConfig.rb --force`
end