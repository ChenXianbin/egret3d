attribute vec4 _glesVertex;   
attribute vec4 _glesColor;                  
attribute vec4 _glesColorEx;                  
attribute vec4 _glesMultiTexCoord0;         
uniform highp mat4 glstate_matrix_mvp;      
varying lowp vec4 xlv_COLOR;                
varying lowp vec4 xlv_COLOREx;                                                 
varying highp vec2 xlv_TEXCOORD0;           
void main() {                                               
    highp vec4 tmpvar_1;                        
    tmpvar_1.w = 1.0;                           
    tmpvar_1.xyz = _glesVertex.xyz;             
    xlv_COLOR = _glesColor;                     
    xlv_COLOREx = _glesColorEx;                     
    xlv_TEXCOORD0 = _glesMultiTexCoord0.xy;     
    gl_Position = (glstate_matrix_mvp * tmpvar_1);  
}