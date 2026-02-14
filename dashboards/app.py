import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
import dash
from dash import html, dcc, Input, Output, State
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import requests
from config.config import API_BASE_URL

# Initialize the app
app = dash.Dash(__name__, suppress_callback_exceptions=True, external_stylesheets=[dbc.themes.BOOTSTRAP])
app.title = "HR ATS - Intelligent Resume Screening System"

# Color scheme
COLORS = {'primary': '#2563eb', 'success': '#10b981', 'danger': '#ef4444', 'warning': '#f59e0b', 'secondary': '#64748b', 'dark': '#1e293b'}

# Layout
app.layout = html.Div([
    dcc.Store(id='auth-store', data={'authenticated': False, 'user': None}),
    
    # Login Screen
    html.Div(id='login-screen', children=[
        html.Div([
            html.Div([
                html.I(className="fas fa-briefcase", style={'fontSize': '60px', 'color': COLORS['primary'], 'marginBottom': '20px'}),
                html.H2("HR ATS Portal", style={'color': COLORS['dark'], 'marginBottom': '5px'}),
                html.P("Intelligent Resume Screening System", style={'color': COLORS['secondary'], 'marginBottom': '30px'})
            ], style={'textAlign': 'center'}),
            html.Div([
                html.Label("Email", style={'color': COLORS['dark'], 'fontWeight': '500'}),
                dcc.Input(id='username-input', type='email', placeholder='hr@company.com',
                         style={'width': '100%', 'padding': '12px', 'marginBottom': '15px', 'border': '1px solid #e2e8f0', 'borderRadius': '6px'}),
                html.Label("Password", style={'color': COLORS['dark'], 'fontWeight': '500'}),
                dcc.Input(id='password-input', type='password', placeholder='Enter password',
                         style={'width': '100%', 'padding': '12px', 'marginBottom': '20px', 'border': '1px solid #e2e8f0', 'borderRadius': '6px'}),
                html.Button("Sign In", id='login-btn', n_clicks=0, 
                           style={'width': '100%', 'padding': '12px', 'backgroundColor': COLORS['primary'], 'color': 'white', 'border': 'none', 'borderRadius': '6px', 'cursor': 'pointer'}),
                html.Div(id='login-error', style={'color': COLORS['danger'], 'textAlign': 'center', 'marginTop': '10px'})
            ], style={'background': 'white', 'padding': '30px', 'borderRadius': '12px', 'boxShadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}),
            html.P("Demo: hr@company.com / demo123", style={'textAlign': 'center', 'marginTop': '20px', 'color': COLORS['secondary'], 'fontSize': '13px'})
        ], style={'maxWidth': '400px', 'margin': '0 auto'})
    ], style={'minHeight': '100vh', 'display': 'flex', 'alignItems': 'center', 'justifyContent': 'center', 'background': 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)'}),

    # Main Content
    html.Div(id='main-content', style={'display': 'none'}, children=[
        html.Nav([
            html.Div([
                html.Div([
                    html.I(className="fas fa-briefcase", style={'color': COLORS['primary'], 'marginRight': '10px', 'fontSize': '24px'}),
                    html.Span("HR ATS", style={'fontSize': '20px', 'fontWeight': 'bold', 'color': COLORS['dark']})
                ]),
                html.Div([
                    html.Span(id='user-display', style={'color': COLORS['secondary'], 'marginRight': '15px'}),
                    html.Button("Logout", id='logout-btn', n_clicks=0, style={'background': 'transparent', 'border': '1px solid #e2e8f0', 'padding': '8px 16px', 'borderRadius': '6px', 'cursor': 'pointer'})
                ], style={'display': 'flex', 'alignItems': 'center'})
            ], style={'display': 'flex', 'justifyContent': 'space-between', 'alignItems': 'center'})
        ], style={'background': 'white', 'padding': '15px 30px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)', 'position': 'sticky', 'top': 0, 'zIndex': 1000}),
        
        html.Div([
            dcc.Tabs(id="tabs", value='dashboard', children=[
                dcc.Tab(label='Dashboard', value='dashboard', style={'padding': '12px 20px'}),
                dcc.Tab(label='Jobs', value='jobs', style={'padding': '12px 20px'}),
                dcc.Tab(label='Screening', value='screening', style={'padding': '12px 20px'}),
                dcc.Tab(label='Ranking', value='ranking', style={'padding': '12px 20px'}),
                dcc.Tab(label='Insights', value='insights', style={'padding': '12px 20px'}),
                dcc.Tab(label='AI Explain', value='explainable', style={'padding': '12px 20px'}),
                dcc.Tab(label='Email', value='emails', style={'padding': '12px 20px'}),
                dcc.Tab(label='Reports', value='analytics', style={'padding': '12px 20px'}),
            ])
        ], style={'background': 'white', 'marginBottom': '20px', 'padding': '0 20px'}),
        
        html.Div(id='tabs-content', style={'padding': '20px'})
    ])
])

# Auth callback
@app.callback(
    [Output('login-screen', 'style'), Output('main-content', 'style'), 
     Output('auth-store', 'data'), Output('login-error', 'children'), Output('user-display', 'children')],
    [Input('login-btn', 'n_clicks'), Input('logout-btn', 'n_clicks')],
    [State('username-input', 'value'), State('password-input', 'value'), State('auth-store', 'data')]
)
def authenticate(login_clicks, logout_clicks, username, password, auth_data):
    ctx = dash.callback_context
    if not ctx.triggered:
        return {'display': 'block'}, {'display': 'none'}, {'authenticated': False, 'user': None}, "", ""
    
    trigger = ctx.triggered[0]['prop_id'].split('.')[0]
    
    if trigger == 'logout-btn':
        return {'display': 'block'}, {'display': 'none'}, {'authenticated': False, 'user': None}, "", ""
    
    if trigger == 'login-btn':
        if login_clicks > 0:
            if username == 'hr@company.com' and password == 'demo123':
                return {'display': 'none'}, {'display': 'block'}, {'authenticated': True, 'user': username}, "", f"Welcome, {username}"
            else:
                return {'display': 'block'}, {'display': 'none'}, {'authenticated': False, 'user': None}, "Invalid credentials", ""
    
    return {'display': 'block'}, {'display': 'none'}, {'authenticated': False, 'user': None}, "", ""

# Tab content
@app.callback(Output('tabs-content', 'children'), Input('tabs', 'value'))
def render_content(tab):
    if tab == 'dashboard':
        return html.Div([
            html.Div([
                html.Div([html.H3("12,450", style={'fontSize': '32px', 'fontWeight': 'bold'}), html.P("Total Resumes")], style={'background': 'white', 'padding': '20px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)', 'textAlign': 'center'}),
                html.Div([html.H3("3,245", style={'fontSize': '32px', 'fontWeight': 'bold', 'color': COLORS['success']}), html.P("Shortlisted")], style={'background': 'white', 'padding': '20px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)', 'textAlign': 'center'}),
                html.Div([html.H3("6,890", style={'fontSize': '32px', 'fontWeight': 'bold', 'color': COLORS['danger']}), html.P("Rejected")], style={'background': 'white', 'padding': '20px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)', 'textAlign': 'center'}),
                html.Div([html.H3("82%", style={'fontSize': '32px', 'fontWeight': 'bold', 'color': COLORS['primary']}), html.P("Avg Match Score")], style={'background': 'white', 'padding': '20px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)', 'textAlign': 'center'}),
            ], style={'display': 'grid', 'gridTemplateColumns': 'repeat(4, 1fr)', 'gap': '20px', 'marginBottom': '30px'}),
            
            html.Div([
                html.Div([
                    html.H4("Recruitment Pipeline", style={'marginBottom': '15px'}),
                    dcc.Graph(figure=go.Figure(data=[go.Funnel(y=['Applied', 'Screened', 'Shortlisted', 'Interviewed', 'Hired'], x=[12450, 8900, 3245, 1200, 380])]).update_layout(height=350))
                ], style={'background': 'white', 'padding': '20px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)', 'flex': '1'}),
                html.Div([
                    html.H4("Top Candidates", style={'marginBottom': '15px'}),
                    html.Div([html.Div([html.Strong("Sarah Chen"), html.P("95% Match - Python, ML")], style={'padding': '10px', 'borderBottom': '1px solid #e2e8f0'}), html.Div([html.Strong("James Rodriguez"), html.P("88% Match - AWS, Python")], style={'padding': '10px', 'borderBottom': '1px solid #e2e8f0'}), html.Div([html.Strong("Priya Sharma"), html.P("85% Match - Python, R")], style={'padding': '10px'})])
                ], style={'background': 'white', 'padding': '20px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)', 'flex': '1'})
            ], style={'display': 'flex', 'gap': '20px'})
        ])
    
    elif tab == 'jobs':
        return html.Div([
            html.H3("Job Management", style={'marginBottom': '20px'}),
            html.Button("Create New Job", style={'background': COLORS['primary'], 'color': 'white', 'padding': '12px 24px', 'border': 'none', 'borderRadius': '6px', 'cursor': 'pointer', 'marginBottom': '20px'}),
            html.Div([
                html.Div([html.H4("Senior ML Engineer"), html.P("Bangalore | $150,000 | Full-time"), html.P("Skills: Python, TensorFlow, ML", style={'color': COLORS['secondary']}), html.Span("245 Applicants", style={'background': COLORS['primary'], 'color': 'white', 'padding': '4px 12px', 'borderRadius': '20px', 'fontSize': '12px'})], style={'background': 'white', 'padding': '20px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)', 'marginBottom': '15px'}),
                html.Div([html.H4("Data Scientist"), html.P("Remote | $120,000 | Full-time"), html.P("Skills: Python, R, SQL", style={'color': COLORS['secondary']}), html.Span("189 Applicants", style={'background': COLORS['primary'], 'color': 'white', 'padding': '4px 12px', 'borderRadius': '20px', 'fontSize': '12px'})], style={'background': 'white', 'padding': '20px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)', 'marginBottom': '15px'}),
                html.Div([html.H4("Full Stack Developer"), html.P("Pune | $100,000 | Full-time"), html.P("Skills: React, Node.js, MongoDB", style={'color': COLORS['secondary']}), html.Span("312 Applicants", style={'background': COLORS['primary'], 'color': 'white', 'padding': '4px 12px', 'borderRadius': '20px', 'fontSize': '12px'})], style={'background': 'white', 'padding': '20px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)'})
            ])
        ])
    
    elif tab == 'screening':
        return html.Div([
            html.H3("Resume Screening", style={'marginBottom': '20px'}),
            html.Div([
                html.H4("Upload Resumes", style={'marginBottom': '15px'}),
                dcc.Upload(id='upload-resume', children=html.Button("Choose Files", style={'background': COLORS['primary'], 'color': 'white', 'padding': '10px 20px', 'border': 'none', 'borderRadius': '6px'}), multiple=True),
                html.P("Supported: PDF, DOCX, TXT", style={'color': COLORS['secondary'], 'marginTop': '10px'})
            ], style={'background': 'white', 'padding': '30px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)', 'textAlign': 'center', 'border': '2px dashed #e2e8f0', 'marginBottom': '20px'})
        ])
    
    elif tab == 'ranking':
        return html.Div([
            html.H3("Candidate Ranking", style={'marginBottom': '20px'}),
            html.Label("Select Job Position", style={'fontWeight': '500', 'marginBottom': '8px'}),
            dcc.Dropdown(id='ranking-job-filter', options=[{'label': 'Senior ML Engineer', 'value': 'ml'}, {'label': 'Data Scientist', 'value': 'ds'}], placeholder='Select a job', style={'width': '300px', 'marginBottom': '20px'}),
            html.Div([
                html.Div([html.Strong("1. Sarah Chen"), html.Br(), html.Span("95% Match", style={'color': COLORS['success'], 'fontWeight': 'bold'})], style={'padding': '15px', 'background': 'white', 'borderRadius': '8px', 'marginBottom': '10px'}),
                html.Div([html.Strong("2. James Rodriguez"), html.Br(), html.Span("88% Match", style={'color': COLORS['success'], 'fontWeight': 'bold'})], style={'padding': '15px', 'background': 'white', 'borderRadius': '8px', 'marginBottom': '10px'}),
                html.Div([html.Strong("3. Priya Sharma"), html.Br(), html.Span("85% Match", style={'color': COLORS['warning'], 'fontWeight': 'bold'})], style={'padding': '15px', 'background': 'white', 'borderRadius': '8px'})
            ])
        ])
    
    elif tab == 'insights':
        return html.Div([
            html.H3("Candidate Insights", style={'marginBottom': '20px'}),
            html.Div([
                html.H4("Skill Demand", style={'marginBottom': '15px'}),
                dcc.Graph(figure=go.Figure(data=[go.Bar(x=['Python', 'SQL', 'ML', 'AWS', 'React'], y=[85, 72, 68, 65, 58], marker={'color': COLORS['primary']})]).update_layout(title="Most Demanded Skills", height=300))
            ], style={'background': 'white', 'padding': '20px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)', 'marginBottom': '20px'}),
            html.Div([
                html.H4("Critical Skill Gaps", style={'marginBottom': '15px'}),
                html.P("MLOps: 30% gap", style={'color': COLORS['danger']}),
                html.P("PyTorch: 20% gap", style={'color': COLORS['danger']}),
                html.P("NLP: 20% gap", style={'color': COLORS['warning']})
            ], style={'background': 'white', 'padding': '20px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)'})
        ])
    
    elif tab == 'explainable':
        return html.Div([
            html.H3("Explainable AI Decisions", style={'marginBottom': '20px'}),
            html.Div([
                html.H4("Decision Factors - Sarah Chen", style={'marginBottom': '15px'}),
                html.Div([html.Strong("Technical Skills Match: +35%"), html.P("Strong Python, ML, TensorFlow skills")], style={'padding': '10px', 'background': '#dcfce7', 'borderRadius': '6px', 'marginBottom': '10px'}),
                html.Div([html.Strong("Experience Level: +30%"), html.P("6 years ML experience exceeds requirements")], style={'padding': '10px', 'background': '#dcfce7', 'borderRadius': '6px', 'marginBottom': '10px'}),
                html.Div([html.Strong("Education: +15%"), html.P("MS Computer Science from top university")], style={'padding': '10px', 'background': '#dcfce7', 'borderRadius': '6px', 'marginBottom': '10px'}),
                html.Div([html.Strong("MLOps Experience: -5%"), html.P("Limited production deployment")], style={'padding': '10px', 'background': '#fee2e2', 'borderRadius': '6px'})
            ], style={'background': 'white', 'padding': '20px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)'})
        ])
    
    elif tab == 'emails':
        return html.Div([
            html.H3("Email Automation", style={'marginBottom': '20px'}),
            html.Div([
                html.H4("Email Templates", style={'marginBottom': '15px'}),
                dcc.Dropdown(id='email-template-select', options=[{'label': 'Interview Invitation', 'value': 'interview'}, {'label': 'Rejection Letter', 'value': 'rejection'}, {'label': 'Offer Letter', 'value': 'offer'}], placeholder='Select template', style={'marginBottom': '15px'}),
                dcc.Dropdown(id='candidate-selection', multi=True, options=[{'label': 'Sarah Chen', 'value': 'sarah@example.com'}, {'label': 'James Rodriguez', 'value': 'james@example.com'}], placeholder='Select candidates', style={'marginBottom': '15px'}),
                html.Button("Send Emails", style={'background': COLORS['success'], 'color': 'white', 'padding': '12px 24px', 'border': 'none', 'borderRadius': '6px', 'cursor': 'pointer'}),
                html.Div(id='email-status', style={'marginTop': '20px'})
            ], style={'background': 'white', 'padding': '20px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)'})
        ])
    
    elif tab == 'analytics':
        return html.Div([
            html.H3("Reports & Analytics", style={'marginBottom': '20px'}),
            html.Div([
                html.H4("Hiring Trends", style={'marginBottom': '15px'}),
                dcc.Graph(figure=go.Figure(data=[go.Scatter(x=['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], y=[45, 52, 38, 65, 48, 72], mode='lines+markers', name='Hired')]).update_layout(title="Hiring Trends (2026)", height=300))
            ], style={'background': 'white', 'padding': '20px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)', 'marginBottom': '20px'}),
            html.Div([
                html.H4("Time to Hire by Department", style={'marginBottom': '15px'}),
                dcc.Graph(figure=go.Figure(data=[go.Bar(x=['Engineering', 'Product', 'Data Science', 'Sales'], y=[28, 32, 35, 21], marker={'color': COLORS['primary']})]).update_layout(height=300))
            ], style={'background': 'white', 'padding': '20px', 'borderRadius': '8px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)'})
        ])
    
    return html.Div("Select a tab")

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=8050)
